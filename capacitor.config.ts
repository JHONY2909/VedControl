import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'VetControl',
  webDir: 'www',
  server: {
    // Permitir conexiones desde localhost para desarrollo
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      // Configuración específica para PWA
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
