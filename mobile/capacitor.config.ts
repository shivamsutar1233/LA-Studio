import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lastudio.mobile',
  appName: 'LA Studio',
  webDir: 'out',
  server: {
    url: 'https://mobilela-studio.vercel.app/',
    cleartext: true
  }
};

export default config;
