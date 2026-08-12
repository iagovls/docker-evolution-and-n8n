import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private _user = signal<User | null>(null);
  private _session = signal<Session | null>(null);
  private _loading = signal(true);

  user = this._user.asReadonly();
  session = this._session.asReadonly();
  loading = this._loading.asReadonly();
  isAuthenticated = computed(() => !!this._user());

  constructor() {
    console.log('[AuthService] Inicializando cliente Supabase...');
    console.log('[AuthService] URL:', environment.supabaseUrl);
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    this.initSession();
  }

  private async initSession(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    console.log('[AuthService] Sessão inicial:', session ? 'autenticado' : 'sem sessão');
    this._session.set(session);
    this._user.set(session?.user ?? null);
    this._loading.set(false);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthService] Auth state changed:', _event);
      this._session.set(session);
      this._user.set(session?.user ?? null);
      this._loading.set(false);
    });
  }

  async login(email: string, password: string): Promise<{ error?: string }> {
    console.log('[AuthService] Tentando login para:', email);
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[AuthService] Erro no login:', error.message);
      return { error: error.message };
    }
    console.log('[AuthService] Login realizado com sucesso');
    return {};
  }

  async logout(): Promise<void> {
    console.log('[AuthService] Realizando logout...');
    await this.supabase.auth.signOut();
    console.log('[AuthService] Logout concluído');
  }

  async resetPassword(email: string): Promise<{ error?: string }> {
    console.log('[AuthService] Enviando email de redefinição para:', email);
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      console.error('[AuthService] Erro ao redefinir senha:', error.message);
      return { error: error.message };
    }
    console.log('[AuthService] Email de redefinição enviado');
    return {};
  }

  async updatePassword(newPassword: string): Promise<{ error?: string }> {
    console.log('[AuthService] Atualizando senha...');
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('[AuthService] Erro ao atualizar senha:', error.message);
      return { error: error.message };
    }
    console.log('[AuthService] Senha atualizada com sucesso');
    return {};
  }

  async getUserEmail(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    console.log('[AuthService] Email do usuário:', user?.email ?? 'não encontrado');
    return user?.email ?? '';
  }
}
