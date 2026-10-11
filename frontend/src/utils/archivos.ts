import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { esNativo } from './plataforma';

function blobABase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Descarga un archivo: en web usa <a download>, en nativo lo guarda
 * en disco y abre el diálogo compartir.
 */
export async function descargarArchivo(blob: Blob, nombre: string, _mimeType?: string): Promise<void> {
  if (!esNativo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  const base64 = await blobABase64(blob);
  const guardado = await Filesystem.writeFile({
    path: nombre,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({
    title: nombre,
    url: guardado.uri,
    dialogTitle: `Compartir ${nombre}`,
  });
}
