'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { saveProduct, saveProductColors } from '@/lib/actions/catalog';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FormMessage, Input, Textarea } from '@/components/ui/form';
import { ColorRowsEditor, emptyColorRow, type ColorRow } from '@/components/admin/color-rows-editor';
import { AUDIENCES, CategoryIcon, type AudienceKey } from '@/lib/icons';
import { uploadProductImage } from '@/lib/images/upload';
import { slugify } from '@/lib/format';
import { cn } from '@/lib/cn';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  audience: AudienceKey;
  price: number;
  sale_price: number | null;
  is_new: boolean;
};

type FieldErrors = Record<string, string[] | undefined>;

/**
 * Formulario del producto. Al crear incluye la sección de colores (cada color con su precio
 * opcional y sus fotos); al editar, los colores se gestionan en su propio panel.
 * La visibilidad en la tienda se decide en Inventario.
 */
export function ProductForm({
  product,
  categories,
  colors = [],
}: {
  product?: Product;
  categories: { id: string; name: string; icon: string | null }[];
  colors?: { id: string; name: string; hex: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [rows, setRows] = useState<ColorRow[]>(() => (product ? [] : [emptyColorRow()]));
  const [fe, setFe] = useState<FieldErrors | undefined>();
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = pending || Boolean(progress);

  // Libera las vistas previas de fotos al desmontar.
  useEffect(() => () => rows.forEach((r) => r.files.forEach((f) => URL.revokeObjectURL(f.preview))), []); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (k: string) => fe?.[k]?.[0];
  const described = (k: string) => (fe?.[k] ? `${k}-error` : undefined);

  if (categories.length === 0) {
    return (
      <FormMessage tone="error">
        Primero cree al menos una categoría en <a href="/admin/categorias" className="underline">Categorías</a>.
      </FormMessage>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setMessage(null);

    if (!product) {
      const invalid = rows.find((r) => (r.mode === 'existing' ? !r.colorId : !r.newName.trim()));
      if (rows.length === 0 || invalid) {
        setMessage({ tone: 'error', text: rows.length === 0 ? 'Agregue al menos un color.' : 'Elija o escriba cada color.' });
        return;
      }
    }

    startTransition(async () => {
      const result = await saveProduct(null, fd);
      if (!result.ok) {
        setFe(result.fieldErrors);
        setMessage({ tone: 'error', text: result.error });
        return;
      }
      setFe(undefined);
      if (product) {
        setMessage({ tone: 'success', text: result.message ?? 'Guardado.' });
        router.refresh();
        return;
      }

      const productId = result.data!.id;
      const saved = await saveProductColors({
        product_id: productId,
        colors: rows.map((r) => ({
          color_id: r.mode === 'existing' ? r.colorId : null,
          new_color: r.mode === 'new' ? { name: r.newName.trim(), hex: r.newHex } : null,
          price: r.price,
        })),
      });
      if (!saved.ok) {
        // El producto ya existe: se continúa en su página para corregir los colores.
        router.push(`/admin/productos/${productId}?creado=1&aviso=colores`);
        return;
      }

      const failures: string[] = [];
      for (const [i, row] of rows.entries()) {
        for (const f of row.files) {
          try {
            await uploadProductImage(f.file, {
              productId,
              alt: name,
              colorId: saved.data!.colorIds[i],
              onProgress: setProgress,
            });
          } catch (e) {
            failures.push(`${f.file.name}: ${e instanceof Error ? e.message : 'error'}`);
          }
        }
      }
      setProgress(null);
      router.push(
        failures.length
          ? `/admin/productos/${productId}?creado=1&aviso=fotos`
          : `/admin/inventario?producto=${productId}&creado=1`,
      );
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre" htmlFor="name" error={err('name')} className="md:col-span-2">
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            maxLength={120}
            required
            aria-invalid={Boolean(err('name'))}
            aria-describedby={described('name')}
          />
        </Field>
        <Field label="Slug (URL pública)" htmlFor="slug" error={err('slug')} hint={`/producto/${slug || 'slug'}`} className="md:col-span-2">
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            maxLength={80}
            required
            aria-invalid={Boolean(err('slug'))}
            aria-describedby={described('slug') ?? 'slug-hint'}
          />
        </Field>
      </div>

      <TileGroup legend="Categoría" error={err('category_id')}>
        {categories.map((c) => (
          <Tile key={c.id} name="category_id" value={c.id} defaultChecked={product?.category_id === c.id} label={c.name}>
            <CategoryIcon icon={c.icon} className="size-6" />
          </Tile>
        ))}
      </TileGroup>

      <TileGroup legend="Colección" error={err('audience')} cols="sm:grid-cols-3">
        {(Object.keys(AUDIENCES) as AudienceKey[]).map((key) => {
          const a = AUDIENCES[key];
          return (
            <Tile key={key} name="audience" value={key} defaultChecked={product?.audience === key} label={a.label} hint={a.hint}>
              <a.Icon className="size-6" aria-hidden strokeWidth={1.5} />
            </Tile>
          );
        })}
      </TileGroup>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Precio (MXN)" htmlFor="price" error={err('price')} hint="Precio de todos los colores, salvo los que tengan uno propio.">
          <Input id="price" name="price" type="number" inputMode="decimal" step="0.01" min="0.01" defaultValue={product?.price ?? ''} required aria-invalid={Boolean(err('price'))} aria-describedby={described('price') ?? 'price-hint'} />
        </Field>
        <Field label="Precio promocional (MXN)" htmlFor="sale_price" optional error={err('sale_price')} hint="Si lo llena, el precio regular aparece tachado.">
          <Input id="sale_price" name="sale_price" type="number" inputMode="decimal" step="0.01" min="0" defaultValue={product?.sale_price ?? ''} aria-invalid={Boolean(err('sale_price'))} aria-describedby={described('sale_price') ?? 'sale_price-hint'} />
        </Field>
        <Field label="Descripción" htmlFor="description" optional error={err('description')} className="md:col-span-2">
          <Textarea id="description" name="description" defaultValue={product?.description ?? ''} maxLength={5000} rows={5} />
        </Field>
      </div>

      <Checkbox
        name="is_new"
        label={
          <>
            Marcar como <strong className="font-medium">novedad</strong>
            <span className="block text-sm text-muted">Aparece primero en el sitio y en «Novedades».</span>
          </>
        }
        defaultChecked={product?.is_new ?? true}
      />

      {!product && (
        <fieldset className="flex flex-col gap-3 rounded-md border border-line p-4 md:p-5">
          <legend className="px-1 text-sm font-medium">Colores y fotografías</legend>
          <p className="text-sm text-muted">
            Agregue cada color del modelo con sus fotos. Si un color cuesta distinto, escriba su precio; si no, usa el precio del producto.
          </p>
          <ColorRowsEditor rows={rows} onChange={setRows} colors={colors} disabled={busy} />
        </fieldset>
      )}

      {progress && <p role="status" className="text-sm text-muted">{progress}</p>}
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        {!product && <p className="text-sm text-muted">Después capturará tallas y cantidades en Inventario.</p>}
      </div>
    </form>
  );
}

function TileGroup({ legend, error, cols, children }: { legend: string; error?: string; cols?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={Boolean(error)}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4', cols)}>{children}</div>
      {error && (
        <p className="text-[0.8125rem] text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Tile({
  name,
  value,
  label,
  hint,
  defaultChecked,
  children,
}: {
  name: string;
  value: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="group relative flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-line bg-white px-3 py-2.5 transition-colors duration-150 hover:border-mocha has-[:checked]:border-espresso has-[:checked]:bg-espresso has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-espresso">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} required className="sr-only" />
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ivory text-espresso group-has-[:checked]:bg-white/15 group-has-[:checked]:text-white">
        {children}
      </span>
      <span className="flex flex-col text-[0.9375rem] leading-tight">
        {label}
        {hint && <span className="text-xs text-muted group-has-[:checked]:text-white/75">{hint}</span>}
      </span>
    </label>
  );
}
