import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';  // ← ESTO ES LO QUE FALTABA
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule   // ← AQUÍ ESTÁ LA MAGIA
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private toast: ToastController
  ) {
    this.loginForm = this.fb.group({
      email: ['veterinario@vetcontrol.c', [Validators.required, Validators.email]],
      password: ['123456', Validators.required]
    });
  }

  // ... el resto del código (ngOnInit, ingresar, mostrarToast) queda IGUAL

  async ngOnInit() {
    // Si ya hay sesión activa → ir directo al dashboard
    const { data } = await this.supabase.supabase.auth.getSession();
    if (data.session) {
      this.router.navigate(['/tabs/tab1']);
    }
  }

  async ingresar() {
  if (this.loginForm.invalid) {
    this.mostrarToast('Completa todos los campos', 'danger');
    return;
  }

  this.loading = true;
  const { email, password } = this.loginForm.value;

  try {
    // Intenta hacer login normal
    let { data, error } = await this.supabase.signIn(email!, password!);

    // Si falla porque el usuario no existe → lo crea automáticamente
    if (error && (error.status === 400 || error.message.includes('Invalid login credentials'))) {
      const { error: signupError } = await this.supabase.supabase.auth.signUp({
        email: email!,
        password: password!
      });

      if (signupError) throw signupError;

      // Después de crear el usuario, inicia sesión automáticamente
      const { data: loginData, error: loginError } = await this.supabase.signIn(email!, password!);
      if (loginError) throw loginError;
      data = loginData;
    }

    if (error) throw error;

    this.mostrarToast('¡Bienvenido a VetControl!', 'success');
    this.router.navigate(['/tabs/tab1']);
  } catch (err: any) {
    this.mostrarToast(err.message || 'Error de autenticación', 'danger');
  } finally {
    this.loading = false;
  }
}

  async mostrarToast(mensaje: string, color: string = 'dark') {
    const t = await this.toast.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'top'
    });
    t.present();
  }

  // Función placeholder para el botón de Google (solo visual por ahora)
  async iniciarConGoogle() {
    // TODO: Implementar autenticación con Google
    this.mostrarToast('Función de Google en desarrollo', 'warning');
  }
}