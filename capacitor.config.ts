import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safivra.app',
  appName: 'Safivra',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
