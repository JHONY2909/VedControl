import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon,
  IonSearchbar, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { AtencionService } from '../services/atencion.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    CommonModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonIcon,
    IonSearchbar, IonRefresher, IonRefresherContent
  ],
})
export class Tab3Page {
  // Usamos la lista ya filtrada del servicio
  atenciones = this.atencionService.filteredAtenciones;

  constructor(private atencionService: AtencionService) {}

  async ionViewWillEnter() {
    this.atencionService.setSearchTerm(''); // limpia búsqueda al entrar
    await this.atencionService.cargar();
  }

  async refrescar(event: any) {
    await this.atencionService.cargar();
    this.atencionService.setSearchTerm(''); // limpia filtro al refrescar
    event.target.complete();
  }

  buscar(event: any) {
    const query = event.target.value || '';
    this.atencionService.setSearchTerm(query);
  }

  verDetalle(atencion: any) {
    console.log('Ver detalle:', atencion);
    // Aquí luego harás la navegación al detalle
  }
}