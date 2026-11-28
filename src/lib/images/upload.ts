'use client';

import { addProductImage } from '@/lib/actions/catalog';
import { createClient } from '@/lib/supabase/browser';
import { processImage } from '@/lib/images/process';
import { STORAGE_BUCKET } from '@/lib/env';

/**
 * Optimiza una foto en el navegador, la sube a Storage (principal + miniatura) y registra
 * sus metadatos. Lanza un Error con mensaje en español si algo falla.
 */
export async function uploadProductImage(
  file: File,
  opts: { productId: string; alt: string; colorId?: string | null; onProgress?: (text: string) => void },
) {
  const supabase = createClient();
  opts.onProgress?.(`Optimizando ${file.name}…`);
  const processed = await processImage(file);
  const base = `products/${opts.productId}/${crypto.randomUUID()}`;
  const mainPath = `${base}.${processed.extension}`;
  const thumbPath = `${base}_thumb.${processed.extension}`;
  const contentType = processed.extension === 'webp' ? 'image/webp' : 'image/jpeg';

  opts.onProgress?.(`Subiendo ${file.name} (${Math.round(processed.main.size / 1024)} KB)…`);
  const up1 = await supabase.storage.from(STORAGE_BUCKET).upload(mainPath, processed.main, { contentType, cacheControl: '31536000' });
  if (up1.error) throw new Error('No se pudo subir la imagen. Verifique su sesión.');
  const up2 = await supabase.storage.from(STORAGE_BUCKET).upload(thumbPath, processed.thumb, { contentType, cacheControl: '31536000' });
  if (up2.error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([mainPath]);
    throw new Error('No se pudo subir la miniatura.');
  }

  const r = await addProductImage({
    product_id: opts.productId,
    storage_path: mainPath,
    thumb_path: thumbPath,
    width: processed.width,
    height: processed.height,
    alt_text: opts.alt,
    color_id: opts.colorId ?? null,
  });
  if (!r.ok) throw new Error(r.error);
}
