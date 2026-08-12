from __future__ import annotations

import json
import os
import re
import unicodedata
from contextlib import contextmanager
from datetime import date, datetime, time
from decimal import Decimal
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Iterator, Literal
from uuid import UUID

from dotenv import load_dotenv
from fastmcp import FastMCP
from psycopg import connect
from psycopg.conninfo import make_conninfo
from psycopg.rows import dict_row
from starlette.middleware import Middleware as StarletteMiddleware
from starlette.types import Receive, Scope, Send

load_dotenv()

APP_NAME = "MCP Imoveis"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_FAQ_PATH = PROJECT_ROOT / "data" / "faq.json"

mcp = FastMCP(APP_NAME)


class HostHeaderRewriteMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get("type") == "http":
            headers = list(scope.get("headers") or [])
            host_header = next((value for key, value in headers if key == b"host"), b"")
            host = host_header.decode("latin-1") if host_header else ""
            allowed = {"localhost", "127.0.0.1", "172.19.0.4", "mcp_imoveis:8000/mcp", "n8n"}
            if host:
                normalized_host = host.split(":", 1)[0]
                if normalized_host not in allowed:
                    port = os.getenv("MCP_SERVER_PORT", "8000").strip() or "8000"
                    replacement = f"localhost:{port}".encode("latin-1")
                    updated_headers: list[tuple[bytes, bytes]] = []
                    replaced = False
                    for key, value in headers:
                        if key == b"host":
                            updated_headers.append((key, replacement))
                            replaced = True
                        else:
                            updated_headers.append((key, value))
                    if not replaced:
                        updated_headers.append((b"host", replacement))
                    scope = dict(scope)
                    scope["headers"] = updated_headers
        await self.app(scope, receive, send)


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", normalized).strip().lower()


def _build_conninfo() -> str:
    dsn = os.getenv("SUPABASE_POSTGRES_DSN", "").strip()
    if dsn:
        return dsn

    host = os.getenv("SUPABASE_POSTGRES_HOST", "").strip()
    user = os.getenv("SUPABASE_POSTGRES_USER", "").strip()
    password = os.getenv("SUPABASE_POSTGRES_PASSWORD", "").strip()

    if not host or not user or not password:
        raise RuntimeError(
            "Configure `SUPABASE_POSTGRES_DSN` ou informe host, usuario e senha do Supabase no `.env`."
        )

    return make_conninfo(
        host=host,
        port=os.getenv("SUPABASE_POSTGRES_PORT", "5432").strip(),
        dbname=os.getenv("SUPABASE_POSTGRES_DATABASE", "postgres").strip(),
        user=user,
        password=password,
        sslmode=os.getenv("SUPABASE_POSTGRES_SSLMODE", "require").strip(),
        connect_timeout=os.getenv("SUPABASE_CONNECT_TIMEOUT", "10").strip(),
    )


@contextmanager
def _get_connection() -> Iterator[Any]:
    conn = connect(_build_conninfo(), row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (datetime, date, time, Decimal, UUID)):
        return str(value)
    return value


@mcp.tool
def buscar_imoveis(
    tipo: Literal["casa", "apartamento", "comercial", "rural"] | None = None,
    cidade: str | None = None,
    bairro: str | None = None,
    finalidade: Literal["venda", "aluguel"] | None = None,
    preco_min: int | None = None,
    preco_max: int | None = None,
    quartos: int | None = None,
    suites: int | None = None,
    banheiros: int | None = None,
    vagas_garagem: int | None = None,
    area_util: float | None = None,
    mobiliado: bool | None = None,
    aceita_pet: bool | None = None,
    limite: int = 20,
) -> dict[str, Any]:
    """
    Busca imoveis aplicando as regras de expansao definidas no servico `Imovel.buscarImoveis`.
    """
    from .Imovel import Imovel

    imovel_service = Imovel()
    limit_value = max(1, min(limite, 100))
    resultados = imovel_service.buscarImoveis(
        tipo=tipo,
        cidade=cidade,
        bairro=bairro,
        finalidade=finalidade,
        preco_min=preco_min,
        preco_max=preco_max,
        quartos=quartos,
        suites=suites,
        banheiros=banheiros,
        vagas_garagem=vagas_garagem,
        area_util=area_util,
        mobiliado=mobiliado,
        aceita_pet=aceita_pet,
        limite=limit_value,
    )
    return {
        "quantidade": len(resultados),
        "limite_aplicado": limit_value,
        "resultados": resultados,
    }


def _load_faq_entries() -> list[dict[str, Any]]:
    faq_path = Path(os.getenv("FAQ_SOURCE_PATH", str(DEFAULT_FAQ_PATH))).expanduser()
    if not faq_path.exists():
        raise FileNotFoundError(f"Arquivo FAQ nao encontrado: {faq_path}")

    with faq_path.open("r", encoding="utf-8") as faq_file:
        raw_entries = json.load(faq_file)

    if not isinstance(raw_entries, list):
        raise ValueError("O arquivo FAQ precisa conter uma lista JSON.")

    valid_entries: list[dict[str, Any]] = []
    for entry in raw_entries:
        if not isinstance(entry, dict):
            continue
        pergunta = str(entry.get("pergunta", "")).strip()
        resposta = str(entry.get("resposta", "")).strip()
        tags = entry.get("tags") or []
        if not pergunta or not resposta:
            continue
        if not isinstance(tags, list):
            tags = []
        valid_entries.append(
            {
                "pergunta": pergunta,
                "resposta": resposta,
                "tags": [str(tag) for tag in tags],
            }
        )

    return valid_entries


def _score_faq_entry(question: str, entry: dict[str, Any]) -> float:
    normalized_question = _normalize_text(question)
    normalized_entry = _normalize_text(
        " ".join([entry["pergunta"], entry["resposta"], " ".join(entry.get("tags", []))])
    )

    question_tokens = set(re.findall(r"\w+", normalized_question))
    entry_tokens = set(re.findall(r"\w+", normalized_entry))
    token_overlap = len(question_tokens & entry_tokens)

    score = SequenceMatcher(a=normalized_question, b=normalized_entry).ratio() * 0.6
    score += min(token_overlap, 8) * 0.12

    for tag in entry.get("tags", []):
        if _normalize_text(tag) in normalized_question:
            score += 0.2

    if _normalize_text(entry["pergunta"]) in normalized_question:
        score += 0.4

    return score


@mcp.tool
def consultar_faq(pergunta: str, top_k: int = 3) -> dict[str, Any]:
    """
    Busca as respostas mais proximas em um FAQ local para apoiar perguntas frequentes.
    """
    clean_question = pergunta.strip()
    if not clean_question:
        raise ValueError("Informe uma pergunta valida.")

    entries = _load_faq_entries()
    ranked_entries = sorted(
        (
            {
                **entry,
                "score": round(_score_faq_entry(clean_question, entry), 4),
            }
            for entry in entries
        ),
        key=lambda item: item["score"],
        reverse=True,
    )

    limited_entries = [entry for entry in ranked_entries[: max(1, min(top_k, 10))] if entry["score"] > 0]

    return {
        "pergunta": clean_question,
        "total_itens_analisados": len(entries),
        "respostas": _json_safe(limited_entries),
        "mensagem": (
            "Nenhuma resposta relevante encontrada no FAQ."
            if not limited_entries
            else "Respostas mais proximas encontradas com sucesso."
        ),
    }


def main() -> None:
    host = os.getenv("MCP_SERVER_HOST", "0.0.0.0").strip() or "0.0.0.0"
    port = int(os.getenv("MCP_SERVER_PORT", "8000").strip() or "8000")
    mcp.run(
        transport="http",
        host=host,
        port=port,
        middleware=[StarletteMiddleware(HostHeaderRewriteMiddleware)],
    )


if __name__ == "__main__":
    main()
