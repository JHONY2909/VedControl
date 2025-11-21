import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://jgzxcbjmmbpcvchfghfg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnenhjYmptbWJwY3ZjaGZnaGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU3MzksImV4cCI6MjA3OTA1MTczOX0.zMXcyNRVbjl4y6ZIkjPQ2FEJUqbfIOupXprwJJjgbVI',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: localStorage  // <-- esto activa multi-tab automáticamente
        }
      }
    );
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }
}
