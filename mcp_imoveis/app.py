from __future__ import annotations

from pathlib import Path
from typing import Any

import gradio as gr
from dotenv import load_dotenv

from mcp_imoveis.Imovel import Imovel
from mcp_imoveis.server import consultar_faq

load_dotenv(Path(__file__).resolve().parent / ".env")

imovel_service = Imovel()


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    clean_value = value.strip()
    return clean_value or None


def _number_to_int(value: float | int | None) -> int | None:
    if value is None:
        return None
    return int(value)


def _number_to_float(value: float | int | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _string_to_bool(value: str) -> bool | None:
    normalized = value.strip().lower()
    if normalized == "":
        return None
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    raise ValueError("Valor booleano invalido.")


def buscar_imoveis(
    tipo: str,
    cidade: str,
    bairro: str,
    finalidade: str,
    preco_min: float | None,
    preco_max: float | None,
    quartos: float | None,
    suites: float | None,
    banheiros: float | None,
    vagas_garagem: float | None,
    area_util: float | None,
    mobiliado: str,
    aceita_pet: str,
    limite: float,
) -> dict[str, Any]:
    try:
        resultados = imovel_service.buscarImoveis(
            tipo=_blank_to_none(tipo),
            cidade=_blank_to_none(cidade),
            bairro=_blank_to_none(bairro),
            finalidade=_blank_to_none(finalidade),
            preco_min=_number_to_int(preco_min),
            preco_max=_number_to_int(preco_max),
            quartos=_number_to_int(quartos),
            suites=_number_to_int(suites),
            banheiros=_number_to_int(banheiros),
            vagas_garagem=_number_to_int(vagas_garagem),
            area_util=_number_to_float(area_util),
            mobiliado=_string_to_bool(mobiliado),
            aceita_pet=_string_to_bool(aceita_pet),
            limite=max(1, min(int(limite), 100)),
        )
        return {
            "quantidade": len(resultados),
            "resultados": resultados,
        }
    except Exception as exc:
        return {"erro": str(exc)}


def buscar_faq(pergunta: str, top_k: float) -> dict[str, Any]:
    try:
        return consultar_faq(pergunta=pergunta, top_k=max(1, min(int(top_k), 10)))
    except Exception as exc:
        return {"erro": str(exc)}


with gr.Blocks(title="MCP Imoveis Teste") as demo:
    gr.Markdown(
        """
        # MCP Imoveis
        Interface simples em Gradio para testar a busca de imoveis e a FAQ.
        Configure o arquivo `.env` em `mcp_imoveis/` antes de consultar o banco.
        """
    )

    with gr.Tab("Buscar Imoveis"):
        with gr.Row():
            tipo = gr.Dropdown(
                choices=["", "casa", "apartamento", "comercial", "rural"],
                value="",
                label="Tipo",
            )
            finalidade = gr.Dropdown(
                choices=["", "venda", "aluguel"],
                value="",
                label="Finalidade",
            )
            cidade = gr.Textbox(label="Cidade")
            bairro = gr.Textbox(label="Bairro")

        with gr.Row():
            preco_min = gr.Number(label="Preco Min", precision=0)
            preco_max = gr.Number(label="Preco Max", precision=0)
            quartos = gr.Number(label="Quartos", precision=0)
            suites = gr.Number(label="Suites", precision=0)
            banheiros = gr.Number(label="Banheiros", precision=0)
            vagas_garagem = gr.Number(label="Vagas Garagem", precision=0)

        with gr.Row():
            area_util = gr.Number(label="Area Util")
            mobiliado = gr.Dropdown(
                choices=["", "true", "false"],
                value="",
                label="Mobiliado",
            )
            aceita_pet = gr.Dropdown(
                choices=["", "true", "false"],
                value="",
                label="Aceita Pet",
            )
            limite = gr.Slider(
                minimum=1,
                maximum=100,
                value=20,
                step=1,
                label="Limite",
            )

        buscar_btn = gr.Button("Buscar", variant="primary")
        resultado_imoveis = gr.JSON(label="Resultado")

        buscar_btn.click(
            fn=buscar_imoveis,
            inputs=[
                tipo,
                cidade,
                bairro,
                finalidade,
                preco_min,
                preco_max,
                quartos,
                suites,
                banheiros,
                vagas_garagem,
                area_util,
                mobiliado,
                aceita_pet,
                limite,
            ],
            outputs=resultado_imoveis,
        )

    with gr.Tab("Consultar FAQ"):
        pergunta = gr.Textbox(label="Pergunta", lines=3, placeholder="Digite sua pergunta")
        top_k = gr.Slider(minimum=1, maximum=10, value=3, step=1, label="Top K")
        faq_btn = gr.Button("Consultar FAQ")
        resultado_faq = gr.JSON(label="Resposta")

        faq_btn.click(
            fn=buscar_faq,
            inputs=[pergunta, top_k],
            outputs=resultado_faq,
        )


if __name__ == "__main__":
    demo.launch(server_name="127.0.0.1", server_port=7860)
