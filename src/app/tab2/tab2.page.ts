// src/app/tabs/tab2/tab2.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';

import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonImg, IonTextarea, IonIcon, IonSpinner,
  IonCard, IonCardContent, IonText, IonCheckbox
} from '@ionic/angular/standalone';

import { AtencionService } from '../services/atencion.service';
import { SupabaseService } from '../services/supabase';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonImg, IonTextarea, IonIcon, IonSpinner,
    IonCard, IonCardContent, IonText, IonCheckbox
  ]
})
export class Tab2Page {
  form = this.fb.group({
    paciente: ['', [Validators.required, Validators.minLength(2)]],
    especie: ['', Validators.required],
    raza: [''],
    motivo: ['', Validators.required],
    diagnostico: [''],
    tratamiento: [''],
    importe: [0, [Validators.required, Validators.min(1)]],
    proximaVacuna: [false]
  });

  foto: string | null = null;     // Vista previa (dataURL)
  fotoUrl: string | null = null;  // URL pública de Supabase Storage
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private atencionService: AtencionService,
    private supabaseService: SupabaseService,
    private toast: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        presentationStyle: 'fullscreen'
      });
      this.foto = image.dataUrl || null;
    } catch (e) {
      this.mostrarToast('No se pudo tomar la foto', 'danger');
    }
  }

  // Convertir dataURL → File para subir
  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  async guardar() {
    if (this.form.invalid) {
      this.mostrarToast('Completa los campos obligatorios', 'warning');
      return;
    }

    this.guardando = true;
    const loading = await this.loadingCtrl.create({
      message: 'Guardando atención...'
    });
    await loading.present();

    let fotoUrl: string | null = null;

    // 1. Subir foto si existe
    if (this.foto) {
      try {
        const fileName = `pacientes/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const file = this.dataURLtoFile(this.foto, 'paciente.jpg');

        const { error } = await this.supabaseService.supabase.storage
          .from('fotos-pacientes')  // ← Crea este bucket en Supabase Storage
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = this.supabaseService.supabase.storage
          .from('fotos-pacientes')
          .getPublicUrl(fileName);

        fotoUrl = publicUrl;
      } catch (error: any) {
        console.error('Error subiendo foto:', error);
        this.mostrarToast('Foto no subida, pero se guarda el resto', 'warning');
        // Continúa sin foto
      }
    }

    // 2. Preparar datos
    const valores = this.form.value;

    const resultado = await this.atencionService.crear({
      paciente: valores.paciente!.trim(),
      especie: valores.especie!,
      raza: valores.raza?.trim() || null,
      motivo: valores.motivo!.trim(),
      diagnostico: valores.diagnostico?.trim() || null,
      tratamiento: valores.tratamiento?.trim() || null,
      importe: Number(valores.importe),
      foto: fotoUrl,
      proximaVacuna: !!valores.proximaVacuna
    });

    await loading.dismiss();
    this.guardando = false;

    if (resultado.error) {
      this.mostrarToast('Error al guardar: ' + resultado.error.message, 'danger');
      return;
    }

    // Éxito
    this.mostrarToast('¡Atención guardada correctamente!', 'success');

    // Notificación local si marcó recordatorio
    if (valores.proximaVacuna) {
      await LocalNotifications.schedule({
        notifications: [{
          title: 'VetControl - Recordatorio de Vacuna',
          body: `${valores.paciente} tiene vacuna pendiente en 30 días`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          sound: 'default'
        }]
      });
    }

    // Resetear todo
    this.form.reset();
    this.form.patchValue({ importe: 0, proximaVacuna: false });
    this.foto = null;
    this.fotoUrl = null;
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toast.create({
      message: mensaje,
      duration: color === 'danger' ? 5000 : 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}