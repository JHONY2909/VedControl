import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AtencionService {
  private supabase = this.supabaseService.supabase;

  // Estado reactivo con Signals
  atenciones = signal<any[]>([]);
  cargando = signal(true);
  
  // Datos mock
  private datosMock = [
    {
      id: 1,
      paciente: 'Max',
      especie: 'Perro',
      raza: 'Golden Retriever',
      motivo: 'Consulta general',
      diagnostico: 'Estado excelente',
      tratamiento: 'Ninguno',
      importe: 50000,
      created_at: new Date().toISOString(),
      user_id: 'mock-user-1',
      proximaVacuna: false
    },
    {
      id: 2,
      paciente: 'Luna',
      especie: 'Gato',
      raza: 'Siamés',
      motivo: 'Vacunación',
      diagnostico: 'Vacunas al día',
      tratamiento: 'Ninguno',
      importe: 30000,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user_id: 'mock-user-1',
      proximaVacuna: true
    }
  ];

  totalIngresosMes = computed(() => {
    const mesActual = new Date().getMonth();
    return this.atenciones()
      .filter(a => new Date(a.created_at).getMonth() === mesActual)
      .reduce((sum, a) => sum + (a.importe || 0), 0);
  });

  constructor(private supabaseService: SupabaseService) {
    this.cargar();
  }

  // ================================
  // Cargar atenciones
  // ================================
  async cargar() {
    this.cargando.set(true);

    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.atenciones.set(this.datosMock);
      } else {
        const { data, error } = await this.supabase
          .from('atenciones')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        this.atenciones.set(data || []);
      }
    } catch (error: any) {
      console.error('Error cargando atenciones:', error);
      this.atenciones.set(this.datosMock);
    } finally {
      this.cargando.set(false);
    }
  }

  // ================================
  // Crear nueva atención
  // ================================
  async crear(atencion: any) {
    const { data: { user } } = await this.supabase.auth.getUser();

    if (!user) {
      alert('Debes estar autenticado');
      return { data: null, error: { message: 'No autenticado' } };
    }

    const payload = {
      ...atencion,
      user_id: user.id,
      foto: atencion.foto || null,
      proximaVacuna: atencion.proximaVacuna || false // 👈 CORRECTO
    };

    const { data, error } = await this.supabase
      .from('atenciones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error insertando:', error);
      return { data: null, error };
    }

    // Actualizar el estado reactivo
    this.atenciones.update(lista => [data, ...lista]);

    return { data, error: null };
  }

  // ================================
  // Listar atenciones
  // ================================
  async listar() {
    const { data, error } = await this.supabase
      .from('atenciones')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  }
}
