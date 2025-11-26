import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then(m => m.RegistroPage)
  },

  // NUEVA RUTA: Detalle de atención (fuera de las tabs)
  {
    path: 'atencion-detalle/:id',
    loadComponent: () => import('./atencion-detalle/atencion-detalle.page')
      .then(m => m.AtencionDetallePage)
  },

  // Rutas antiguas que ya no usas (puedes borrarlas si quieres)
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  // },
  // {
  //   path: 'historial',
  //   loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage)
  // },
];