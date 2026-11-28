'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { removeProductColor, saveProductColors } from '@/lib/actions/catalog';
import { ImageManager } from '@/components/admin/image-manager';
import { ColorRowsEditor, emptyColorRow, type ColorRow } from '@/components/admin/color-rows-editor';
import { uploadProductImage } from '@/lib/images/upload';
import { Button } from '@/components/ui/button';
import { FormMessage, Input } from '@/components/ui/form';
import { ConfirmAction } from '@/components/ui/confirm';
import { formatPrice } from '@/lib/format';

type Img = Parameters<typeof ImageManager>[0]['images'][number];
type ProductColor = { color: { id: string; name: string; hex: string }; price: number | null; stockSizes: number };

/** Colores del producto en la página de edición: precio propio, fotos de cada color y alta/baja. */
export function ProductColorsManager({
  productId,
  productName,
  basePrice,
  productColors,
  images,
  allColors,
}: {
  productId: string;
  productName: string;
  basePrice: number;
  productColors: ProductColor[];
  images: Img[];
  allColors: { id: string; name: string; hex: string }[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState<ColorRow[] | null>(null);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const colorOptions = productColors.map((pc) => pc.color);
  const general = images.filter((i) => !i.color_id || !colorOptions.some((c) => c.id === i.color_id));
  const available = allColors.filter((c) => !colorOptions.some((pc) => pc.id === c.id));

  function addColors(rows: ColorRow[]) {
    const invalid = rows.find((r) => (r.mode === 'existing' ? !r.colorId : !r.newName.trim()));
    if (invalid) return setMsg({ tone: 'error', text: 'Elija o escriba cada color.' });
    setMsg(null);
    startTransition(async () => {
      const r = await saveProductColors({
        product_id: productId,
        colors: rows.map((row) => ({
          color_id: row.mode === 'existing' ? row.colorId : null,
          new_color: row.mode === 'new' ? { name: row.newName.trim(), hex: row.newHex } : null,
          price: row.price,
        })),
      });
      if (!r.ok) return setMsg({ tone: 'error', text: r.error });
      for (const [i, row] of rows.entries()) {
        for (const f of row.files) {
          try {
            await uploadProductImage(f.file, { productId, alt: productName, colorId: r.data!.colorIds[i], onProgress: setProgress });
          } catch (e) {
            setMsg({ tone: 'error', text: `${f.file.name}: ${e instanceof Error ? e.message : 'error'}` });
          }
        }
      }
      setProgress(null);
      setAdding(null);
      setMsg((m) => m ?? { tone: 'success', text: 'Color agregado.' });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {productColors.length === 0 && (
        <p className="text-sm text-muted">Este producto aún no tiene colores. Agregue al menos uno para capturar tallas en Inventario.</p>
      )}

      {productColors.map((pc) => (
        <section key={pc.color.id} className="flex flex-col gap-4 rounded-md border border-line p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full border border-line" style={{ backgroundColor: pc.color.hex }} aria-hidden />
              <div>
                <h3 className="font-medium">{pc.color.name}</h3>
                <p className="text-sm text-muted">
                  {pc.price ? `Precio propio ${formatPrice(pc.price)}` : `Usa el precio del producto (${formatPrice(basePrice)})`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <PriceEditor
                key={`${pc.color.id}-${pc.price}`}
                initial={pc.price}
                disabled={pending}
                onSave={(price) =>
                  startTransition(async () => {
                    const r = await saveProductColors({ product_id: productId, colors: [{ color_id: pc.color.id, price }] });
                    setMsg(r.ok ? { tone: 'success', text: 'Precio del color guardado.' } : { tone: 'error', text: r.error });
                    router.refresh();
                  })
                }
              />
              {pc.stockSizes === 0 && (
                <ConfirmAction
                  trigger="Quitar color"
                  triggerVariant="ghost"
                  title={`Quitar ${pc.color.name}`}
                  description="El color deja de aparecer en el producto. Sus fotos quedan como fotos generales."
                  confirmLabel="Quitar"
                  action={() => removeProductColor(productId, pc.color.id)}
                  onDone={() => router.refresh()}
                />
              )}
            </div>
          </div>
          <ImageManager
            productId={productId}
            productName={productName}
            images={images.filter((i) => i.color_id === pc.color.id)}
            colors={colorOptions}
            uploadColorId={pc.color.id}
            inputId={`upload-${pc.color.id}`}
            uploadLabel={`Fotos de ${pc.color.name}`}
          />
        </section>
      ))}

      {general.length > 0 && (
        <section className="flex flex-col gap-4 rounded-md border border-line p-4">
          <div>
            <h3 className="font-medium">Fotos generales</h3>
            <p className="text-sm text-muted">Se muestran con cualquier color. Puede asignarles un color abajo de cada foto.</p>
          </div>
          <ImageManager productId={productId} productName={productName} images={general} colors={colorOptions} inputId="upload-general" uploadLabel="Fotos generales" />
        </section>
      )}

      {progress && <p role="status" className="text-sm text-muted">{progress}</p>}
      {msg && <FormMessage tone={msg.tone}>{msg.text}</FormMessage>}

      {adding ? (
        <div className="flex flex-col gap-3 rounded-md border border-dashed border-mocha/60 p-4">
          <ColorRowsEditor
            rows={adding}
            onChange={(next) => setAdding((prev) => (typeof next === 'function' ? next(prev ?? []) : next))}
            colors={available}
            disabled={pending || Boolean(progress)}
          />
          <div className="flex gap-2">
            <Button onClick={() => addColors(adding)} disabled={pending || Boolean(progress)}>
              {pending ? 'Guardando…' : 'Guardar colores'}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(null)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="secondary" onClick={() => setAdding([emptyColorRow()])}>
            <Plus className="size-4" aria-hidden /> Agregar color
          </Button>
        </div>
      )}
    </div>
  );
}

function PriceEditor({ initial, onSave, disabled }: { initial: number | null; onSave: (price: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState(initial?.toString() ?? '');
  const changed = value !== (initial?.toString() ?? '');
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-muted">
        Precio propio
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Igual al producto"
          className="h-9 w-36 text-sm"
        />
      </label>
      {changed && (
        <Button type="submit" size="sm" disabled={disabled}>
          Guardar
        </Button>
      )}
    </form>
  );
}
