// src/app/atencion-detalle/atencion-detalle.page.ts
import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AtencionService } from '../services/atencion.service';

import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonImg, IonBadge, IonIcon, IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-atencion-detalle',
  templateUrl: './atencion-detalle.page.html',
  styleUrls: ['./atencion-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonImg, IonBadge, IonIcon, IonButton
  ]
})
export class AtencionDetallePage {
  atencionId = signal<string | null>(null);  // ← Ahora es string!

  atencion = computed(() => {
    const id = this.atencionId();
    if (!id) return null;

    // ← Compara como string, no como número
    return this.atencionService.atenciones().find(a => a.id === id) || null;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private atencionService: AtencionService
  ) {
    this.route.params.subscribe(params => {
      const id = params['id']; // ← Ya no haces parseInt
      this.atencionId.set(id || null);
    });
  }

  ionViewWillEnter() {
    this.atencionService.cargar(); // Asegura datos frescos
  }

  volver() {
    this.router.navigate(['/tabs/tab3']);
  }
}