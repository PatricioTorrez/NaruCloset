'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star } from 'lucide-react';
import {
  addProductImage,
  deleteProductImage,
  reorderImages,
  setPrimaryImage,
  updateProductImage,
} from '@/lib/actions/catalog';
import { createClient } from '@/lib/supabase/browser';
import { processImage } from '@/lib/images/process';
import { publicImageUrl, STORAGE_BUCKET } from '@/lib/env';
import { FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { ConfirmAction } from '@/components/ui/confirm';

type Img = {
  id: string;
  storage_path: string;
  thumb_path: string;
  alt_text: string | null;
  color_id: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number;
  height: number;
};

export function ImageManager({
  productId,
  productName,
  images,
  colors,
}: {
  productId: string;
  productName: string;
  images: Img[];
  colors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList) {
    setMsg(null);
    const supabase = createClient();
    let done = 0;
    for (const file of Array.from(files).slice(0, 10)) {
      try {
        setProgress(`Optimizando ${file.name}…`);
        const processed = await processImage(file);
        const imageId = crypto.randomUUID();
        const base = `products/${productId}/${imageId}`;
        const mainPath = `${base}.${processed.extension}`;
        const thumbPath = `${base}_thumb.${processed.extension}`;
        const contentType = processed.extension === 'webp' ? 'image/webp' : 'image/jpeg';

        setProgress(`Subiendo ${file.name} (${Math.round(processed.main.size / 1024)} KB)…`);
        const up1 = await supabase.storage.from(STORAGE_BUCKET).upload(mainPath, processed.main, { contentType, cacheControl: '31536000' });
        if (up1.error) throw new Error('No se pudo subir la imagen. Verifique su sesión.');
        const up2 = await supabase.storage.from(STORAGE_BUCKET).upload(thumbPath, processed.thumb, { contentType, cacheControl: '31536000' });
        if (up2.error) {
          await supabase.storage.from(STORAGE_BUCKET).remove([mainPath]);
          throw new Error('No se pudo subir la miniatura.');
        }

        const r = await addProductImage({
          product_id: productId,
          storage_path: mainPath,
          thumb_path: thumbPath,
          width: processed.width,
          height: processed.height,
          alt_text: productName,
        });
        if (!r.ok) throw new Error(r.error);
        done += 1;
      } catch (e) {
        setMsg({ tone: 'error', text: `${file.name}: ${e instanceof Error ? e.message : 'error desconocido'}` });
      }
    }
    setProgress(null);
    if (done > 0) {
      setMsg((m) => m ?? { tone: 'success', text: done === 1 ? 'Fotografía agregada.' : `${done} fotografías agregadas.` });
      router.refresh();
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setMsg({ tone: 'error', text: r.error ?? 'Error' });
      router.refresh();
    });
  }

  function move(index: number, dir: -1 | 1) {
    const ids = images.map((i) => i.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderImages(productId, ids));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          id="image-upload"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
          disabled={Boolean(progress)}
        />
        <label
          htmlFor="image-upload"
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-espresso px-5 text-[0.9375rem] font-medium text-white hover:bg-[#433c38]"
        >
          <ImagePlus className="size-4" aria-hidden />
          Subir fotografías
        </label>
        <p className="text-sm text-muted">Se optimizan a WebP (~250 KB) sin recortar. Se muestran en marco 4:5.</p>
      </div>
      {progress && <p role="status" className="text-sm text-muted">{progress}</p>}
      {msg && <FormMessage tone={msg.tone}>{msg.text}</FormMessage>}

      {images.length === 0 ? (
        <p className="text-sm text-muted">Sin fotografías. En el catálogo se mostrará un espacio neutro.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand/40">
                <Image src={publicImageUrl(img.thumb_path)!} alt={img.alt_text ?? ''} fill sizes="200px" className="object-cover" />
                {img.is_primary && (
                  <Badge tone="soldout" className="absolute top-2 left-2">
                    Principal
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex">
                  <IconBtn label="Mover antes" disabled={pending || i === 0} onClick={() => move(i, -1)}>
                    <ArrowLeft className="size-4" />
                  </IconBtn>
                  <IconBtn label="Mover después" disabled={pending || i === images.length - 1} onClick={() => move(i, 1)}>
                    <ArrowRight className="size-4" />
                  </IconBtn>
                  {!img.is_primary && (
                    <IconBtn label="Hacer principal" disabled={pending} onClick={() => run(() => setPrimaryImage(productId, img.id))}>
                      <Star className="size-4" />
                    </IconBtn>
                  )}
                </div>
                <ConfirmAction
                  trigger="Eliminar"
                  triggerVariant="ghost"
                  title="Eliminar fotografía"
                  description="Se borra del almacenamiento y del catálogo. Para reemplazarla, suba la nueva y elimine esta."
                  confirmLabel="Eliminar"
                  action={() => deleteProductImage(img.id)}
                  onDone={() => router.refresh()}
                />
              </div>
              {colors.length > 0 && (
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Color de la foto
                  <select
                    defaultValue={img.color_id ?? ''}
                    onChange={(e) => run(() => updateProductImage(img.id, { color_id: e.target.value || null }))}
                    className="h-9 rounded-md border border-line bg-white px-2 text-sm text-espresso"
                  >
                    <option value="">Todos los colores</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-md hover:bg-sand/50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
