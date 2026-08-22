import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { S3Service } from './s3.service';

export type Finalidade = 'venda' | 'aluguel';

export interface Imovel {
  id: number;
  quartos: number | null;
  imv_codigo: string;
  titulo: string | null;
  fonte_url: string | null;
  suites: number | null;
  tipo: string;
  uf: string;
  cidade: string;
  regiao_cidade: string | null;
  endereco: string | null;
  preco: number;
  preco_mensal: boolean;
  condominio_preco: number | null;
  iptu_preco: number | null;
  area_util_m2: number | null;
  area_total_m2: number | null;
  vagas_carro: number | null;
  andar: number | null;
  ano: number | null;
  mobiliado: string | null;
  banheiros: number | null;
  imagem_principal: string | null;
  destaques: string | null;
  bairro: string | null;
  atualizado_em: string | null;
  aceita_pet: boolean | null;
  finalidade: Finalidade;
  created_at: string;
  comodidades: string | null;
  proximidades: string | null;
  condicoes: string | null;
  restricoes: string | null;
  active: boolean | null;
}

export type ImovelCreate = Omit<Imovel, 'id' | 'created_at' | 'atualizado_em'>;
export type ImovelUpdate = Partial<ImovelCreate> & { imv_codigo: string };

export interface ImovelImage {
  key: string;
  url: string;
  size?: number;
  lastModified?: string;
  isPrincipal?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private supabase: SupabaseClient;

  constructor(private s3: S3Service) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  private withSchema() {
    const schema = (environment as unknown as { supabaseSchema: string }).supabaseSchema;
    return (this.supabase as unknown as { schema: (s: string) => SupabaseClient }).schema(schema);
  }

  async getImoveis(onlyActive = false): Promise<Imovel[]> {
    const client = this.withSchema();
    let query = client.from('imoveis').select('*').order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PropertiesService] Erro ao buscar imóveis:', error.message);
      return [];
    }

    return (data as Imovel[]) || [];
  }

  async getImovelByCodigo(codigo: string): Promise<Imovel | null> {
    const client = this.withSchema();
    const { data, error } = await client.from('imoveis').select('*').eq('imv_codigo', codigo).maybeSingle();

    if (error) {
      console.error('[PropertiesService] Erro ao buscar imóvel por código:', error.message);
      return null;
    }

    return (data as Imovel) || null;
  }

  async createImovel(imovel: ImovelCreate): Promise<Imovel | null> {
    const client = this.withSchema();
    const { data, error } = await client.from('imoveis').insert([imovel]).select().maybeSingle();

    if (error) {
      console.error('[PropertiesService] Erro ao criar imóvel:', error.message);
      return null;
    }

    const created = (data as Imovel) || null;
    if (created?.imv_codigo) {
      const prefix = this.buildImovelKeyPrefix(created.imv_codigo);
      try {
        await this.s3.createFolder(prefix);
      } catch (folderErr) {
        console.warn('[PropertiesService] Falha ao criar pasta S3 para imóvel, mas imóvel foi criado:', folderErr);
      }
    }

    return created;
  }

  async updateImovel(imovel: ImovelUpdate): Promise<Imovel | null> {
    const client = this.withSchema();
    const { imv_codigo, ...payload } = imovel;
    const updateData = { ...payload, atualizado_em: new Date().toISOString() };

    const { data, error } = await client
      .from('imoveis')
      .update(updateData)
      .eq('imv_codigo', imv_codigo)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[PropertiesService] Erro ao atualizar imóvel:', error.message);
      return null;
    }

    return (data as Imovel) || null;
  }

  async deleteImovel(codigo: string): Promise<boolean> {
    const prefix = this.buildImovelKeyPrefix(codigo);
    try {
      const { deleted } = await this.s3.deletePrefix(prefix);
      console.log(`[PropertiesService] Foram excluidos ${deleted} objetos S3 do prefixo ${prefix}`);
    } catch (s3Err) {
      console.warn('[PropertiesService] Falha ao excluir objetos S3, continuando com exclusao do banco:', s3Err);
    }

    const client = this.withSchema();
    const { error } = await client.from('imoveis').delete().eq('imv_codigo', codigo);

    if (error) {
      console.error('[PropertiesService] Erro ao excluir imóvel:', error.message);
      return false;
    }

    return true;
  }

  async setImagemPrincipal(codigo: string, imagem_url: string | null): Promise<Imovel | null> {
    return this.updateImovel({ imv_codigo: codigo, imagem_principal: imagem_url });
  }

  formatCurrency(value: number | null): string {
    if (value == null) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatArea(value: number | null): string {
    if (value == null) return '';
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 1,
    }).format(value) + ' m²';
  }

  buildImovelKeyPrefix(imovelCodigo: string): string {
    return `${imovelCodigo}/`;
  }
}
