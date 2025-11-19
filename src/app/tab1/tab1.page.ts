// src/app/tabs/tab1/tab1.page.ts
import { Component, AfterViewInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Chart } from 'chart.js/auto';

import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';

import { AtencionService } from '../services/atencion.service';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonSpinner
  ]
})
export class Tab1Page {

  // === ESTADO REACTIVO CON SIGNALS (nivel intermedio SENA) ===
  atenciones = this.atencionService.atenciones;
  cargando = this.atencionService.cargando;

  // Estadísticas computadas automáticamente
  ingresosMes = computed(() => {
    const mes = new Date().getMonth();
    const año = new Date().getFullYear();
    return this.atenciones()
      .filter(a => {
        const fecha = new Date(a.created_at);
        return fecha.getMonth() === mes && fecha.getFullYear() === año;
      })
      .reduce((sum, a) => sum + Number(a.importe || 0), 0);
  });

  cantidadMes = computed(() => {
    const mes = new Date().getMonth();
    const año = new Date().getFullYear();
    return this.atenciones().filter(a => {
      const fecha = new Date(a.created_at);
      return fecha.getMonth() === mes && fecha.getFullYear() === año;
    }).length;
  });

  ultimas5 = computed(() => this.atenciones().slice(0, 5));

  // Gráficos
  chartBarras: any;
  chartPie: any;

  constructor(
    private atencionService: AtencionService,
    private supabase: SupabaseService,
    private router: Router
  ) {
    // Cada vez que cambien las atenciones → actualiza gráficos automáticamente
    effect(() => {
      if (!this.cargando()) {
        setTimeout(() => this.actualizarGraficos(), 100);
      }
    });
  }

  async ionViewWillEnter() {
    // Refresca datos cada vez que entras al tab
    await this.atencionService.cargar();
  }

  private actualizarGraficos() {
    // Verificar que los canvas existan antes de crear los gráficos
    const canvasBarras = document.getElementById('chartBarras') as HTMLCanvasElement;
    const canvasPie = document.getElementById('chartPie') as HTMLCanvasElement;
    
    if (!canvasBarras || !canvasPie) {
      console.warn('Canvas elements not found, retrying...');
      setTimeout(() => this.actualizarGraficos(), 200);
      return;
    }

    // Destruir gráficos anteriores si existen
    if (this.chartBarras) this.chartBarras.destroy();
    if (this.chartPie) this.chartPie.destroy();

    const datos = this.atenciones();

    // === GRÁFICO DE BARRAS: Ingresos últimos 6 meses ===
    const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });

    const ingresosPorMes = ultimos6Meses.map(mes => {
      return datos
        .filter(a => {
          const f = new Date(a.created_at);
          return f.getMonth() === mes.getMonth() && f.getFullYear() === mes.getFullYear();
        })
        .reduce((sum, a) => sum + Number(a.importe || 0), 0);
    });

    try {
      this.chartBarras = new Chart(canvasBarras, {
        type: 'bar',
        data: {
          labels: ultimos6Meses.map(m => m.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })),
          datasets: [{
            label: 'Ingresos',
            data: ingresosPorMes,
            backgroundColor: '#42a5f5',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    } catch (error) {
      console.error('Error creating bar chart:', error);
    }

    // === GRÁFICO PIE: Por especie ===
    const porEspecie = datos.reduce((acc: any, a) => {
      acc[a.especie] = (acc[a.especie] || 0) + 1;
      return acc;
    }, {});

    try {
      this.chartPie = new Chart(canvasPie, {
        type: 'doughnut',
        data: {
          labels: Object.keys(porEspecie),
          datasets: [{
            data: Object.values(porEspecie),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            borderWidth: 2,
            borderColor: '#000'
          }]
        },
        options: { responsive: true }
      });
    } catch (error) {
      console.error('Error creating pie chart:', error);
    }
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }

  irATab2() {
    // Navegación usando el sistema nativo de tabs de Ionic
    // En lugar de usar router.navigate, usamos el tab selection
    this.router.navigate(['/tabs/tab2']);
  }
}