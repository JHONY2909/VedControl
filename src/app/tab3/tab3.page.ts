import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // ← Agregamos Router
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
  atenciones = this.atencionService.filteredAtenciones;

  constructor(
    private atencionService: AtencionService,
    private router: Router  // ← Inyectamos Router
  ) {}

  async ionViewWillEnter() {
    this.atencionService.setSearchTerm('');
    await this.atencionService.cargar();
  }

  async refrescar(event: any) {
    await this.atencionService.cargar();
    this.atencionService.setSearchTerm('');
    event.target.complete();
  }

  buscar(event: any) {
    const query = event.target.value || '';
    this.atencionService.setSearchTerm(query);
  }

  // ¡AHORA SÍ NAVEGA!
verDetalle(atencion: any) {
  this.router.navigate(['/atencion-detalle', atencion.id]); // ← funciona con string o número
}

}