import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/** Inicialización solo-app-nativa: status bar acorde al tema y ocultar splash. */
export async function initNativo(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const oscuro = !document.documentElement.classList.contains('light') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    await StatusBar.setStyle({ style: oscuro ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: oscuro ? '#0a0a0f' : '#f5f5fa' });
  } catch {
    /* Web o plugin no disponible */
  } finally {
    try {
      await SplashScreen.hide();
    } catch {
      /* noop */
    }
  }
}
