'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eye, EyeOff, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { removeEmptyProduct, saveProductColors, setProductVisibility } from '@/lib/actions/catalog';
import { ColorRowsEditor, emptyColorRow, type ColorRow } from '@/components/admin/color-rows-editor';
import { uploadProductImage } from '@/lib/images/upload';
import { addColorStock, editColorStock } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, FormMessage, Input, Select, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/cn';

/**
 * Ojo de visibilidad: abierto = se muestra en la tienda; tachado = oculto.
 * Cada cambio se confirma en un modal.
 */
export function VisibilityToggle({
  productId,
  productName,
  visible,
  available,
  hasPhotos,
}: {
  productId: string;
  productName: string;
  visible: boolean;
  available: number;
  hasPhotos: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const Icon = visible ? Eye : EyeOff;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={visible ? `${productName}: visible en la tienda. Ocultar` : `${productName}: oculto. Mostrar en la tienda`}
        title={visible ? 'Visible en la tienda' : 'Oculto en la tienda'}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors duration-150',
          visible
            ? 'border-success/30 bg-success/10 text-success hover:bg-success/15'
            : 'border-line bg-ivory text-muted hover:border-mocha hover:text-espresso',
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
        <span>{visible ? 'Visible' : 'Oculto'}</span>
      </button>
      <Dialog open={open} onClose={() => { setOpen(false); setError(null); }} title={visible ? '¿Ocultar de la tienda?' : '¿Mostrar en la tienda?'}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 text-[0.9375rem]">
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', visible ? 'bg-ivory text-muted' : 'bg-success/10 text-success')}>
              {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            </span>
            <p>
              {visible ? (
                <>
                  <strong className="font-medium">{productName}</strong> dejará de aparecer en el catálogo público. No se pierde nada: puede
                  volver a mostrarlo cuando quiera.
                </>
              ) : (
                <>
                  <strong className="font-medium">{productName}</strong> aparecerá en el catálogo público con sus colores, fotos y precios.
                </>
              )}
            </p>
          </div>
          {!visible && (available === 0 || !hasPhotos) && (
            <FormMessage tone="error">
              {available === 0 && !hasPhotos
                ? 'Aún no tiene fotos ni existencias: se verá sin foto y como agotado.'
                : available === 0
                  ? 'Aún no tiene existencias: se verá como agotado.'
                  : 'Aún no tiene fotos: se verá con un espacio neutro.'}
            </FormMessage>
          )}
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await setProductVisibility(productId, !visible);
                  if (!r.ok) return setError(r.error);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {pending ? 'Guardando…' : visible ? 'Sí, ocultar' : 'Sí, mostrar en la tienda'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** Agrega piezas de un color: cantidades por talla. Registra una entrada de mercancía. */
export function AddStockButton({
  productId,
  productName,
  color,
  sizes,
  current,
  autoOpen = false,
}: {
  productId: string;
  productName: string;
  color: { id: string; name: string; hex: string };
  sizes: { id: string; name: string }[];
  /** Existencias actuales por talla (size_id → en tienda) */
  current: Record<string, number>;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const total = Object.values(qty).reduce((n, v) => n + (Number.parseInt(v, 10) || 0), 0);

  function close() {
    setOpen(false);
    setQty({});
    setNotes('');
    setError(null);
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <PackagePlus className="size-4" aria-hidden /> Agregar piezas
      </Button>
      <Dialog open={open} onClose={close} title="Agregar piezas" variant="sheet">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const r = await addColorStock({
                product_id: productId,
                color_id: color.id,
                notes,
                items: sizes.map((s) => ({ size_id: s.id, quantity: Number.parseInt(qty[s.id] ?? '', 10) || 0 })),
              });
              if (!r.ok) return setError(r.error);
              close();
              router.refresh();
            });
          }}
        >
          <p className="flex items-center gap-2 text-[0.9375rem]">
            <span className="size-5 rounded-full border border-line" style={{ backgroundColor: color.hex }} aria-hidden />
            {productName} · <span className="font-medium">{color.name}</span>
          </p>
          <p className="text-sm text-muted">Escriba cuántas piezas llegaron de cada talla. Deje en blanco las que no tenga.</p>
          {sizes.length === 0 ? (
            <FormMessage tone="error">
              No hay tallas activas. Créelas en <a href="/admin/atributos" className="underline">Colores y tallas</a>.
            </FormMessage>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {sizes.map((s) => (
                <label key={s.id} className="flex flex-col gap-1 rounded-md border border-line p-2 text-center has-[input:focus]:border-espresso">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={10000}
                    value={qty[s.id] ?? ''}
                    onChange={(e) => setQty((q) => ({ ...q, [s.id]: e.target.value.replace(/\D/g, '') }))}
                    placeholder="0"
                    className="h-10 text-center tabular-nums"
                    aria-label={`Piezas talla ${s.name}`}
                  />
                  <span className="text-xs text-muted tabular-nums">Hay {current[s.id] ?? 0}</span>
                </label>
              ))}
            </div>
          )}
          <Field label="Nota" htmlFor={`notes-${color.id}`} optional>
            <Textarea id={`notes-${color.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="min-h-16" placeholder="Proveedor, factura…" />
          </Field>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || total === 0}>
              {pending ? 'Guardando…' : total > 0 ? `Agregar ${total} pieza${total === 1 ? '' : 's'}` : 'Agregar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

const REASONS = ['Conteo físico', 'Error de captura', 'Prenda dañada', 'Pérdida o robo'];

/** Editar existencias de un color: nueva cantidad por talla (solo owner). Todo o nada, con motivo. */
export function EditStockButton({
  productName,
  color,
  variants,
}: {
  productName: string;
  color: { name: string; hex: string };
  variants: { id: string; size: string; onHand: number; reserved: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'manual_adjustment' | 'admin_correction'>('manual_adjustment');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valueOf = (v: (typeof variants)[number]) => values[v.id] ?? String(v.onHand);
  const changed = variants.filter((v) => valueOf(v) !== '' && Number.parseInt(valueOf(v), 10) !== v.onHand);
  const belowReserved = variants.find((v) => Number.parseInt(valueOf(v) || '0', 10) < v.reserved);
  const fieldId = `edit-${variants[0]?.id ?? 'x'}`;

  function close() {
    setOpen(false);
    setValues({});
    setReason('');
    setError(null);
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="size-4" aria-hidden /> Editar existencias
      </Button>
      <Dialog open={open} onClose={close} title="Editar existencias" variant="sheet">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const r = await editColorStock({
                items: changed.map((v) => ({ variant_id: v.id, new_on_hand: Number.parseInt(valueOf(v), 10) })),
                reason,
                type,
              });
              if (!r.ok) return setError(r.error);
              close();
              router.refresh();
            });
          }}
        >
          <p className="flex items-center gap-2 text-[0.9375rem]">
            <span className="size-5 rounded-full border border-line" style={{ backgroundColor: color.hex }} aria-hidden />
            {productName} · <span className="font-medium">{color.name}</span>
          </p>
          <p className="text-sm text-muted">Escriba cuántas piezas hay realmente de cada talla. El cambio queda en el historial.</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {variants.map((v) => {
              const n = Number.parseInt(valueOf(v) || '0', 10);
              const delta = valueOf(v) === '' ? 0 : n - v.onHand;
              return (
                <label key={v.id} className="flex flex-col gap-1 rounded-md border border-line p-2 text-center has-[input:focus]:border-espresso">
                  <span className="text-sm font-medium">{v.size}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={v.reserved}
                    max={100000}
                    value={valueOf(v)}
                    onChange={(e) => setValues((s) => ({ ...s, [v.id]: e.target.value.replace(/\D/g, '') }))}
                    className="h-10 text-center tabular-nums"
                    aria-label={`Piezas talla ${v.size}`}
                    aria-invalid={n < v.reserved}
                  />
                  <span className={cn('text-xs tabular-nums', delta === 0 ? 'text-muted' : 'font-medium')}>
                    {delta === 0 ? `Antes ${v.onHand}` : delta > 0 ? `+${delta}` : delta}
                  </span>
                  {v.reserved > 0 && <span className="text-[0.6875rem] text-muted">{v.reserved} apartadas</span>}
                </label>
              );
            })}
          </div>
          {belowReserved && (
            <FormMessage tone="error">
              La talla {belowReserved.size} tiene {belowReserved.reserved} apartadas: no puede quedar con menos.
            </FormMessage>
          )}
          <Field label="Motivo" htmlFor={`${fieldId}-reason`} hint="Obligatorio. Elija uno o escríbalo.">
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setType(r === 'Error de captura' ? 'admin_correction' : 'manual_adjustment');
                  }}
                  className={cn(
                    'h-8 rounded-full border px-3 text-sm transition-colors duration-150',
                    reason === r ? 'border-espresso bg-espresso text-white' : 'border-line hover:border-mocha',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Input id={`${fieldId}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Motivo del cambio" />
          </Field>
          <Field label="Tipo" htmlFor={`${fieldId}-type`}>
            <Select id={`${fieldId}-type`} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="manual_adjustment">Ajuste (conteo físico, daño, pérdida)</option>
              <option value="admin_correction">Corrección (error de captura)</option>
            </Select>
          </Field>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || changed.length === 0 || Boolean(belowReserved) || reason.trim().length < 3}>
              {pending ? 'Guardando…' : changed.length ? `Guardar ${changed.length} talla${changed.length === 1 ? '' : 's'}` : 'Sin cambios'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

/** Quitar de la tienda un producto sin existencias: se elimina, o se archiva si tiene historial. */
export function RemoveProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Quitar ${productName}`}
        title="Quitar producto (no tiene existencias)"
        className="inline-flex size-10 items-center justify-center rounded-full border border-line text-muted transition-colors duration-150 hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
      >
        <Trash2 className="size-[18px]" aria-hidden />
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title="¿Quitar este producto?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 text-[0.9375rem]">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
              <Trash2 className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-2">
              <p>
                <strong className="font-medium">{productName}</strong> no tiene existencias. Saldrá de la tienda y del inventario.
              </p>
              <p className="text-sm text-muted">
                Si nunca tuvo entradas ni ventas se elimina por completo, con sus fotos. Si ya tuvo movimientos, se archiva para
                conservar el historial; puede restaurarlo desde Productos.
              </p>
            </div>
          </div>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await removeEmptyProduct(productId);
                  if (!r.ok) return setError(r.error);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {pending ? 'Quitando…' : 'Sí, quitar'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** Agregar colores a un producto desde Inventario (con precio propio y fotos opcionales). */
export function AddColorsButton({
  productId,
  productName,
  colors,
  prominent = false,
}: {
  productId: string;
  productName: string;
  /** Colores del catálogo que el producto todavía no tiene */
  colors: { id: string; name: string; hex: string }[];
  prominent?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ColorRow[]>(() => [emptyColorRow()]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = pending || Boolean(progress);

  function close() {
    rows.forEach((r) => r.files.forEach((f) => URL.revokeObjectURL(f.preview)));
    setOpen(false);
    setRows([emptyColorRow()]);
    setError(null);
  }

  function save() {
    if (rows.some((r) => (r.mode === 'existing' ? !r.colorId : !r.newName.trim()))) {
      setError('Elija o escriba cada color.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await saveProductColors({
        product_id: productId,
        colors: rows.map((row) => ({
          color_id: row.mode === 'existing' ? row.colorId : null,
          new_color: row.mode === 'new' ? { name: row.newName.trim(), hex: row.newHex } : null,
          price: row.price,
        })),
      });
      if (!r.ok) return setError(r.error);
      for (const [i, row] of rows.entries()) {
        for (const f of row.files) {
          try {
            await uploadProductImage(f.file, { productId, alt: productName, colorId: r.data!.colorIds[i], onProgress: setProgress });
          } catch (e) {
            setError(`${f.file.name}: ${e instanceof Error ? e.message : 'error'}`);
          }
        }
      }
      setProgress(null);
      close();
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant={prominent ? 'primary' : 'ghost'} onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Agregar color
      </Button>
      <Dialog open={open} onClose={close} title="Agregar color" variant="sheet">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {productName}: elija el color, su precio si es distinto y sus fotos. Después podrá agregar las piezas de cada talla.
          </p>
          <ColorRowsEditor rows={rows} onChange={setRows} colors={colors} disabled={busy} />
          {progress && <p role="status" className="text-sm text-muted">{progress}</p>}
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? 'Guardando…' : rows.length > 1 ? `Guardar ${rows.length} colores` : 'Guardar color'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
