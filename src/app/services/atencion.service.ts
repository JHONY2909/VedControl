import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AtencionService {

  constructor(private supabase: SupabaseService) {}

  async crear(atencion: any) {
  const user = (await this.supabase.supabase.auth.getUser()).data.user;
  if (!user) {
    console.error('No hay usuario autenticado');
    return { error: 'No autenticado' };
  }

  return await this.supabase.supabase
    .from('atenciones')
    .insert({
      ...atencion,
      user_id: user.id   // ← ESTO ES LO QUE FALTABA
    });
}

  async listar() {
    return await this.supabase.supabase
      .from('atenciones')
      .select('*')
      .order('created_at', { ascending: false });
  }

  async estadisticasMes() {
    const { data } = await this.supabase.supabase
      .from('atenciones')
      .select('importe')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString())
      .lte('created_at', new Date().toISOString());

    const total = data?.reduce((sum, a: any) => sum + (a.importe || 0), 0) || 0;
    const cantidad = data?.length || 0;
    return { total, cantidad };
  }
}