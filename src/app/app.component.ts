// src/app/app.component.ts
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

// ← NUEVO: Importamos addIcons y los iconos que usas
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashBinOutline,
  pawOutline,
  sadOutline,
  cameraOutline,
  addCircleOutline,
  searchOutline,
  homeOutline,
  personOutline,
  menuOutline,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // ← AQUÍ REGISTRAMOS LOS ICONOS UNA SOLA VEZ (al iniciar la app)
    addIcons({
      'create-outline': createOutline,
      'trash-bin-outline': trashBinOutline,
      'paw-outline': pawOutline,
      'sad-outline': sadOutline,
      'camera-outline': cameraOutline,
      'add-circle-outline': addCircleOutline,
      'search-outline': searchOutline,
      'home-outline': homeOutline,
      'person-outline': personOutline,
      'menu-outline': menuOutline,
      'close-outline': closeOutline,
      // Puedes seguir agregando los que uses después
    });
  }
}