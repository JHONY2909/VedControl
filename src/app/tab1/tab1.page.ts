// src/app/tabs/tab1/tab1.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonList, IonItem, IonLabel 
} from '@ionic/angular/standalone';
import { AtencionService } from '../services/atencion.service';
import { SupabaseService } from '../services/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonList, IonItem, IonLabel
  ]
})
export class Tab1Page {
  estadisticas: any = { total: 0, cantidad: 0 };
  ultimas: any[] = [];

  constructor(
    private atencionService: AtencionService,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ionViewWillEnter() {
    this.estadisticas = await this.atencionService.estadisticasMes();
    const { data } = await this.atencionService.listar();
    this.ultimas = data?.slice(0, 5) || [];
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}