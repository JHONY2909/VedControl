import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton
} from '@ionic/angular/standalone';
import { AtencionService } from '../services/atencion.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton
  ]
})
export class Tab2Page {
  atencion: any = { paciente: '', especie: '', motivo: '', importe: 0 };

  constructor(
    private atencionService: AtencionService,
    private toast: ToastController,
    private router: Router
  ) {}

  async guardar() {
    const { error } = await this.atencionService.crear(this.atencion);
    if (error) {
      this.toast.create({ message: 'Error', color: 'danger', duration: 3000 }).then(t => t.present());
    } else {
      this.toast.create({ message: 'Atención guardada!', color: 'success', duration: 2000 }).then(t => t.present());
      this.atencion = { paciente: '', especie: '', motivo: '', importe: 0 };
      this.router.navigate(['/tabs/tab1']);
    }
  }
}