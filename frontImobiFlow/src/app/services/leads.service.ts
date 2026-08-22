import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Lead {
  id: number;
  nome: string | null;
  tel: number;
  conversation_id: string | null;
  ultimo_contato: string | null;
  ticket: number | null;
  created_at: string;
}

export interface ConversationMessage {
  id: number;
  created_at: string;
  role: string;
  message: string | null;
  client_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeadsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  private withSchema() {
    return (this.supabase as unknown as { schema: (s: string) => SupabaseClient }).schema('pierre');
  }

  async getLeads(): Promise<Lead[]> {
    const client = this.withSchema();
    const { data, error } = await client
      .from('usuarios')
      .select('*')
      .order('ultimo_contato', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[LeadsService] Erro ao buscar leads:', error.message);
      return [];
    }
    
    return (data as Lead[]) || [];
  }

  async getConversationByTel(tel: number): Promise<ConversationMessage[]> {
    const client = this.withSchema();
    const { data, error } = await client
      .from('conversation')
      .select('*')
      .eq('client_id', tel)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[LeadsService] Erro ao buscar conversa:', error.message);
      return [];
    }

    return (data as ConversationMessage[]) || [];
  }

  formatWhatsAppUrl(tel: number): string {
    const telStr = tel.toString();
    return `https://wa.me/${telStr}`;
  }
}
