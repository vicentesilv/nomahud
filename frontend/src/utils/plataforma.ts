import { Capacitor } from '@capacitor/core';

/** true cuando la app corre empaquetada con Capacitor (iOS/Android). */
export const esNativo = Capacitor.isNativePlatform();

/** Plataforma actual: 'ios' | 'android' | 'web'. */
export const plataforma = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
