// src/app/atencion-detalle/atencion-detalle.page.ts
import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AtencionService } from '../services/atencion.service';
import { AlertController, ToastController } from '@ionic/angular';

import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonImg, IonBadge
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-atencion-detalle',
  templateUrl: './atencion-detalle.page.html',
  styleUrls: ['./atencion-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonImg, IonBadge
  ]
})
export class AtencionDetallePage {
  atencionId = signal<string | null>(null);

  atencion = computed(() => {
    const id = this.atencionId();
    if (!id) return null;
    return this.atencionService.atenciones().find(a => a.id === id) || null;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private atencionService: AtencionService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.route.params.subscribe(params => {
      this.atencionId.set(params['id'] || null);
    });
  }

  ionViewWillEnter() {
    this.atencionService.cargar();
  }

  volver() {
    this.router.navigate(['/tabs/tab3']);
  }

  // EDITAR
  editar() {
    const atencion = this.atencion();
    if (!atencion) return;
    this.router.navigate(['/tabs/tab2'], { 
      state: { atencionEditar: atencion } 
    });
  }

  // ELIMINAR CON CONFIRMACIÓN
  async confirmarEliminar() {
    const atencion = this.atencion();
    if (!atencion) return;

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar atención?',
      message: `¿Estás seguro de eliminar la atención de <strong>${atencion.paciente}</strong>? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminar()
        }
      ]
    });
    await alert.present();
  }

  async eliminar() {
    const atencion = this.atencion();
    if (!atencion) return;

    const { error } = await this.atencionService.eliminar(atencion.id);

    if (error) {
      this.mostrarToast('Error al eliminar', 'danger');
      console.error(error);
      return;
    }

    this.mostrarToast('Atención eliminada', 'success');
    this.router.navigate(['/tabs/tab3']);
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}