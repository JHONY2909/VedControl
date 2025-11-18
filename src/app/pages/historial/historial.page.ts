import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonRefresher,
  IonRefresherContent, IonSpinner, IonList
} from '@ionic/angular/standalone';
import { AtencionService } from '../../services/atencion.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonRefresher, IonRefresherContent, IonSpinner, IonList
  ]
})
export class HistorialPage implements OnInit {

  atenciones: any[] = [];
  cargando = true;

  constructor(private atencionService: AtencionService) { }

  async ngOnInit() {
    await this.cargarHistorial();
  }

  async ionViewWillEnter() {
    await this.cargarHistorial();
  }

  async cargarHistorial() {
    this.cargando = true;
    const { data, error } = await this.atencionService.listar();
    if (error) {
      console.error('Error cargando historial:', error);
      this.atenciones = [];
    } else {
      this.atenciones = data || [];
    }
    this.cargando = false;
  }

  async onRefresh(event: any) {
    await this.cargarHistorial();
    if (event && event.target && event.target.complete) {
      event.target.complete();
    }
  }
}