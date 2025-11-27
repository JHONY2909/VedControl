// src/app/tabs/tab2/tab2.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router'; // ← Agregamos Router
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ViewChild, ElementRef } from '@angular/core';

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

  atencionAEditar: any = null; // ← NUEVO: Para edición
  
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private atencionService: AtencionService,
    private supabaseService: SupabaseService,
    private toast: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router // ← NUEVO: Inyectamos Router
  ) {}

  ionViewWillEnter() {
    // ← NUEVO: Detectar si viene para editar
    const state = history.state;
    if (state?.atencionEditar) {
      this.atencionAEditar = state.atencionEditar;
      this.prellenarFormulario();
    }
  }

  async tomarFoto() {
    try {
      // Verificar si estamos en un entorno web
      const isWeb = typeof window !== 'undefined' && !this.isRunningInApp();
      
      if (isWeb) {
        // En entorno web, primero verificar si getUserMedia está disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          this.mostrarToast('La cámara no está disponible en este navegador. Use "Seleccionar" para subir foto.', 'warning');
          return;
        }

        // Verificar permisos de cámara
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length === 0) {
            this.mostrarToast('No se encontró ninguna cámara en el dispositivo. Use "Seleccionar" para subir foto.', 'warning');
            return;
          }
        } catch (permError) {
          console.error('Error verificando dispositivos:', permError);
          this.mostrarToast('Error de permisos de cámara. Use "Seleccionar" para subir foto.', 'warning');
          return;
        }
      }

      // Verificar que Camera esté disponible
      if (!Camera || !Camera.getPhoto) {
        this.mostrarToast('Cámara no disponible. Use "Seleccionar" para subir foto desde galería.', 'warning');
        return;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.foto = image.dataUrl || null;
      this.mostrarToast('Foto tomada correctamente', 'success');

    } catch (error: any) {
      console.error('Error tomando foto:', error);
      
      let mensaje = 'Error al tomar foto';
      if (error?.message) {
        if (error.message.includes('Permission denied')) {
          mensaje = 'Permiso de cámara denegado. Por favor permita el acceso a la cámara.';
        } else if (error.message.includes('No Camera available')) {
          mensaje = 'No hay cámara disponible en este dispositivo.';
        } else if (error.message.includes('User cancelled')) {
          mensaje = 'Captura de foto cancelada';
          return; // No mostrar toast para cancelación del usuario
        } else if (error.message.includes('Cannot read properties')) {
          mensaje = 'Error de inicialización de cámara. Use "Seleccionar" para subir foto.';
        } else {
          mensaje = `Error: ${error.message}`;
        }
      } else {
        mensaje = 'Error de cámara. Use "Seleccionar" para subir foto desde galería.';
      }
      
      this.mostrarToast(mensaje, 'warning');
    }
  }

  private isRunningInApp(): boolean {
    // Detectar si estamos corriendo en la app nativa vs navegador web
    return !!(window as any).Capacitor?.isNative;
  }

  // Método para mostrar información sobre el entorno
  private getCameraRecommendation(): string {
    if (this.isRunningInApp()) {
      return 'Usando cámara nativa - Ambos botones funcionan correctamente';
    } else {
      const hasCamera = typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia;
      return hasCamera 
        ? 'Entorno web con cámara disponible - "Tomar foto" abre la cámara del navegador'
        : 'Entorno web sin cámara - Use "Seleccionar" para subir fotos desde archivos';
    }
  }

  async seleccionarFoto() {
    try {
      // En entorno nativo, usar Camera con source:Photos
      if (this.isRunningInApp() && Camera && Camera.getPhoto) {
        try {
          const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Photos
          });
          this.foto = image.dataUrl || null;
          this.mostrarToast('Foto seleccionada correctamente', 'success');
          return;
        } catch (cameraError) {
          console.warn('Error con Camera.getPhoto, usando input file:', cameraError);
          // Si falla Camera.getPhoto, usar input file como respaldo
        }
      }
      
      // En entorno web, o si falla Camera en nativo, usar input file
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.click();
        this.mostrarToast('Abriendo selector de archivos...', 'success');
      } else {
        throw new Error('No se puede acceder al selector de archivos');
      }
      
    } catch (error: any) {
      console.error('Error seleccionando foto:', error);
      let mensaje = 'Error al seleccionar foto';
      
      if (error?.message) {
        if (error.message.includes('User cancelled')) {
          mensaje = 'Selección de foto cancelada';
        } else {
          mensaje = `Error: ${error.message}`;
        }
      } else {
        mensaje = 'Error inesperado. Intente nuevamente.';
      }
      
      this.mostrarToast(mensaje, 'danger');
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) {
      this.mostrarToast('No se seleccionó ningún archivo', 'warning');
      return;
    }

    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      this.mostrarToast('Por favor selecciona un archivo de imagen (JPG, PNG, etc.)', 'warning');
      this.limpiarInputFile();
      return;
    }

    // Verificar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.mostrarToast('La imagen es demasiado grande (máximo 10MB). Seleccione una imagen más pequeña.', 'warning');
      this.limpiarInputFile();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (e.target?.result) {
        this.foto = e.target.result;
        this.mostrarToast('Foto cargada correctamente', 'success');
      } else {
        this.mostrarToast('Error al procesar la imagen', 'danger');
      }
      this.limpiarInputFile();
    };
    reader.onerror = () => {
      this.mostrarToast('Error al cargar la imagen', 'danger');
      this.limpiarInputFile();
    };
    reader.readAsDataURL(file);
  }

  private limpiarInputFile() {
    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const loading = await this.loadingCtrl.create({
      message: this.atencionAEditar ? 'Actualizando...' : 'Guardando...'
    });
    await loading.present();

    let fotoUrl = this.fotoUrl; // Por si no cambia la foto

    // 1. Subir foto si hay nueva
    if (this.foto && !this.foto.startsWith('https://')) { // Solo si es nueva (dataURL)
      const supabase = this.supabaseService.supabase;
      const fileName = `paciente-${Date.now()}.jpg`;
      const file = await fetch(this.foto).then(res => res.blob());

      const { error } = await supabase.storage
        .from('fotos-pacientes')
        .upload(fileName, file, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo foto:', error);
        this.mostrarToast('Foto no subida, pero se guarda el resto', 'warning');
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-pacientes')
          .getPublicUrl(fileName);
        fotoUrl = publicUrl;
      }
    }

    // 2. Preparar datos
    const valores = this.form.value;

    if (this.atencionAEditar) {
      // ← NUEVO: Actualizar si es edición
      const { error } = await this.supabaseService.supabase
        .from('atenciones')
        .update({
          paciente: valores.paciente!.trim(),
          especie: valores.especie!,
          raza: valores.raza?.trim() || null,
          motivo: valores.motivo!.trim(),
          diagnostico: valores.diagnostico?.trim() || null,
          tratamiento: valores.tratamiento?.trim() || null,
          importe: Number(valores.importe),
          foto: fotoUrl || null,
          proximaVacuna: !!valores.proximaVacuna
        })
        .eq('id', this.atencionAEditar.id);

      if (error) {
        this.mostrarToast('Error al actualizar: ' + error.message, 'danger');
        await loading.dismiss();
        this.guardando = false;
        return;
      }

      this.mostrarToast('¡Atención actualizada correctamente!', 'success');

      // Refrescar la lista en el servicio
      await this.atencionService.cargar();

    } else {
      // Crear nuevo (código original)
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

      if (resultado.error) {
        this.mostrarToast('Error al guardar: ' + resultado.error.message, 'danger');
        await loading.dismiss();
        this.guardando = false;
        return;
      }

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
    }

    await loading.dismiss();
    this.guardando = false;

    // Limpiar formulario
    this.limpiarFormulario();

    // Volver al historial o dashboard (opcional)
    this.router.navigate(['/tabs/tab3']);
  }

  // ← NUEVO: Prellenar para edición
  private prellenarFormulario() {
    const a = this.atencionAEditar;
    this.form.patchValue({
      paciente: a.paciente,
      especie: a.especie,
      raza: a.raza || '',
      motivo: a.motivo,
      diagnostico: a.diagnostico || '',
      tratamiento: a.tratamiento || '',
      importe: a.importe,
      proximaVacuna: a.proximaVacuna
    });
    this.foto = a.foto || null;
    this.fotoUrl = a.foto || null;
  }

  // ← NUEVO: Limpiar después de guardar
  private limpiarFormulario() {
    this.form.reset();
    this.form.patchValue({ importe: 0, proximaVacuna: false });
    this.foto = null;
    this.fotoUrl = null;
    this.atencionAEditar = null;
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