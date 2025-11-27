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
      // En entorno web, usar implementación nativa de HTML5
      const isWeb = typeof window !== 'undefined' && !this.isRunningInApp();
      
      if (isWeb) {
        const resultado = await this.tomarFotoWeb();
        if (resultado) {
          this.foto = resultado;
        }
        return;
      }

      // En entorno nativo, usar Capacitor Camera
      if (Camera && Camera.getPhoto) {
        try {
          const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera
          });
          this.foto = image.dataUrl || null;
        } catch (cameraError) {
          console.warn('Error con Capacitor Camera:', cameraError);
          this.mostrarToast('Error al abrir la cámara', 'warning');
        }
      } else {
        this.mostrarToast('Cámara no disponible', 'warning');
      }

    } catch (error: any) {
      console.error('Error tomando foto:', error);
      this.mostrarToast('Error al acceder a la cámara', 'warning');
    }
  }

  private async tomarFotoWeb(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      // Verificar soporte de la API de MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.mostrarToast('La cámara no está disponible en este navegador', 'warning');
        resolve(null);
        return;
      }

      // Crear elemento de video temporal para capturar la cámara
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.zIndex = '9999';
      video.style.backgroundColor = 'black';

      // Botón de captura circular como cámara de celular
      const captureButton = document.createElement('button');
      captureButton.style.position = 'fixed';
      captureButton.style.bottom = '50px';
      captureButton.style.left = '50%';
      captureButton.style.transform = 'translateX(-50%)';
      captureButton.style.zIndex = '10000';
      captureButton.style.width = '70px';
      captureButton.style.height = '70px';
      captureButton.style.borderRadius = '50%';
      captureButton.style.border = '4px solid white';
      captureButton.style.backgroundColor = 'transparent';
      captureButton.style.cursor = 'pointer';
      captureButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';

      // Botón cancelar moderno (X)
      const cancelButton = document.createElement('button');
      cancelButton.innerHTML = '✕';
      cancelButton.style.position = 'fixed';
      cancelButton.style.top = '20px';
      cancelButton.style.right = '20px';
      cancelButton.style.zIndex = '10000';
      cancelButton.style.width = '40px';
      cancelButton.style.height = '40px';
      cancelButton.style.borderRadius = '50%';
      cancelButton.style.backgroundColor = 'rgba(255,255,255,0.2)';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.fontSize = '20px';
      cancelButton.style.fontWeight = 'bold';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.backdropFilter = 'blur(10px)';

      // Botón para cambiar a galería (como en celulares)
      const galleryButton = document.createElement('button');
      galleryButton.innerHTML = '🖼️';
      galleryButton.style.position = 'fixed';
      galleryButton.style.bottom = '50px';
      galleryButton.style.left = '30px';
      galleryButton.style.zIndex = '10000';
      galleryButton.style.width = '50px';
      galleryButton.style.height = '50px';
      galleryButton.style.borderRadius = '8px';
      galleryButton.style.backgroundColor = 'rgba(255,255,255,0.9)';
      galleryButton.style.border = 'none';
      galleryButton.style.fontSize = '20px';
      galleryButton.style.cursor = 'pointer';
      galleryButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';

      // Mini preview de la última foto tomada
      const previewFrame = document.createElement('div');
      previewFrame.style.position = 'fixed';
      previewFrame.style.bottom = '50px';
      previewFrame.style.right = '30px';
      previewFrame.style.zIndex = '10000';
      previewFrame.style.width = '50px';
      previewFrame.style.height = '50px';
      previewFrame.style.borderRadius = '8px';
      previewFrame.style.border = '2px solid white';
      previewFrame.style.backgroundColor = 'rgba(255,255,255,0.1)';
      previewFrame.style.display = 'flex';
      previewFrame.style.alignItems = 'center';
      previewFrame.style.justifyContent = 'center';
      previewFrame.style.fontSize = '20px';
      previewFrame.style.color = 'white';

      // Configurar canvas con dimensiones estándar
      canvas.width = 640;
      canvas.height = 480;

      // Función para limpiar elementos
      const cleanup = () => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        video.remove();
        canvas.remove();
        captureButton.remove();
        cancelButton.remove();
        galleryButton.remove();
        previewFrame.remove();
      };

      // Función para capturar foto
      const capturePhoto = () => {
        // Ajustar canvas al tamaño del video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Capturar frame
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir a dataURL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        cleanup();
        resolve(dataUrl);
      };

      // Eventos de botones
      captureButton.addEventListener('click', capturePhoto);
      cancelButton.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      // Evento para cambiar a galería
      galleryButton.addEventListener('click', async () => {
        cleanup();
        // Cerrar la interfaz de cámara y abrir la galería directamente
        await this.seleccionarFoto();
        resolve(null);
      });

      // Intentar acceder a la cámara
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      .then(stream => {
        video.srcObject = stream;
        document.body.appendChild(video);
        document.body.appendChild(captureButton);
        document.body.appendChild(cancelButton);
        document.body.appendChild(galleryButton);
        document.body.appendChild(previewFrame);
        
        video.addEventListener('loadedmetadata', () => {
          // Video listo para usar
          this.mostrarToast('📷 Cámara abierta - Toca el círculo para capturar o 🖼️ para galería', 'success');
        });

        video.addEventListener('error', (error) => {
          console.error('Error en video:', error);
          cleanup();
          this.mostrarToast('Error al acceder a la cámara', 'warning');
          resolve(null);
        });

      })
      .catch(error => {
        console.error('Error accediendo a la cámara:', error);
        
        let mensaje = 'No se pudo acceder a la cámara.';
        if (error.name === 'NotAllowedError') {
          mensaje = 'Permiso de cámara denegado. Por favor permita el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
          mensaje = 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotSupportedError') {
          mensaje = 'La cámara no está soportada en este navegador.';
        }
        
        this.mostrarToast(mensaje, 'warning');
        resolve(null);
      });
    });
  }

  isRunningInApp(): boolean {
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
      // En entorno nativo, intentar usar Camera solo si está disponible
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
      
      // Usar input file (más compatible y confiable)
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