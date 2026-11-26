/**
 * Optimización de fotografías en el navegador antes de subirlas (docs/ARCHITECTURE.md A5).
 * - No recorta ni deforma: conserva la proporción original; el sitio la muestra en marco 4:5.
 * - Objetivo ~100–250 KB por foto principal; miniatura de 480 px de ancho.
 * - WebP cuando el navegador lo soporta; si no (Safari antiguo), JPEG.
 */

export type ProcessedImage = {
  main: Blob;
  thumb: Blob;
  width: number;
  height: number;
  extension: 'webp' | 'jpg';
};

const MAIN_BOX = { width: 1200, height: 1500 };
const THUMB_BOX = { width: 480, height: 600 };
const TARGET_BYTES = 250 * 1024;
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

function fit(w: number, h: number, box: { width: number; height: number }) {
  const scale = Math.min(1, box.width / w, box.height / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

async function encode(
  bitmap: ImageBitmap,
  size: { width: number; height: number },
  type: string,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen.'))), type, quality),
  );
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La imagen supera 25 MB.');

  // imageOrientation respeta la rotación EXIF de fotos tomadas con el teléfono.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const mainSize = fit(bitmap.width, bitmap.height, MAIN_BOX);
    const thumbSize = fit(bitmap.width, bitmap.height, THUMB_BOX);

    let type = 'image/webp';
    let main = await encode(bitmap, mainSize, type, 0.82);
    if (main.type !== 'image/webp') {
      type = 'image/jpeg';
      main = await encode(bitmap, mainSize, type, 0.82);
    }
    // Reduce calidad gradualmente hasta acercarse al objetivo de peso.
    for (const q of [0.74, 0.66, 0.58]) {
      if (main.size <= TARGET_BYTES) break;
      main = await encode(bitmap, mainSize, type, q);
    }
    const thumb = await encode(bitmap, thumbSize, type, 0.72);

    return {
      main,
      thumb,
      width: mainSize.width,
      height: mainSize.height,
      extension: type === 'image/webp' ? 'webp' : 'jpg',
    };
  } finally {
    bitmap.close();
  }
}
