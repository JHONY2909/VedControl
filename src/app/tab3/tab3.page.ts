import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon,
  IonSearchbar, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { AtencionService } from '../services/atencion.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
      CommonModule, RouterModule,
      IonHeader, IonToolbar, IonTitle, IonContent,
      IonList, IonItem, IonLabel, IonIcon,
      IonSearchbar, IonRefresher, IonRefresherContent
    ],
})
export class Tab3Page {
  atenciones = this.atencionService.atenciones;
  
  constructor(
    private atencionService: AtencionService
  ) {}

  async ionViewWillEnter() {
    await this.atencionService.cargar();
  }

  async refrescar(event: any) {
    await this.atencionService.cargar();
    event.target.complete();
  }

  buscar(event: CustomEvent) {
    // Aquí puedes implementar búsqueda si es necesario
    console.log('Búsqueda:', event.detail.value);
  }

  verDetalle(atencion: any) {
    // Implementar navegación al detalle de la atención
    console.log('Ver detalle:', atencion);
  }
}
