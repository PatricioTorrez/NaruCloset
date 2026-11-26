'use client';

import { useActionState, useState } from 'react';
import { saveProduct } from '@/lib/actions/catalog';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from '@/components/ui/form';
import { slugify } from '@/lib/format';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  audience: 'women' | 'men' | 'unisex';
  price: number;
  sale_price: number | null;
  is_active: boolean;
  is_new: boolean;
  is_featured: boolean;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveProduct, null);
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const err = (k: string) => fe?.[k]?.[0];
  const described = (k: string) => (fe?.[k] ? `${k}-error` : undefined);

  if (categories.length === 0) {
    return (
      <FormMessage tone="error">
        Primero cree al menos una categoría en <a href="/admin/categorias" className="underline">Categorías</a>.
      </FormMessage>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
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
        <Field label="Categoría" htmlFor="category_id" error={err('category_id')}>
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ''} required aria-invalid={Boolean(err('category_id'))}>
            <option value="" disabled>
              Elija una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Colección" htmlFor="audience" error={err('audience')}>
          <Select id="audience" name="audience" defaultValue={product?.audience ?? ''} required aria-invalid={Boolean(err('audience'))}>
            <option value="" disabled>
              Elija la colección
            </option>
            <option value="women">Mujer</option>
            <option value="men">Hombre</option>
            <option value="unisex">Unisex (aparece en ambas)</option>
          </Select>
        </Field>
        <Field label="Precio (MXN)" htmlFor="price" error={err('price')}>
          <Input id="price" name="price" type="number" inputMode="decimal" step="0.01" min="0.01" defaultValue={product?.price ?? ''} required aria-invalid={Boolean(err('price'))} aria-describedby={described('price')} />
        </Field>
        <Field label="Precio promocional (MXN)" htmlFor="sale_price" optional error={err('sale_price')} hint="Si lo llena, el precio regular aparece tachado.">
          <Input id="sale_price" name="sale_price" type="number" inputMode="decimal" step="0.01" min="0" defaultValue={product?.sale_price ?? ''} aria-invalid={Boolean(err('sale_price'))} aria-describedby={described('sale_price') ?? 'sale_price-hint'} />
        </Field>
        <Field label="Descripción" htmlFor="description" optional error={err('description')} className="md:col-span-2">
          <Textarea id="description" name="description" defaultValue={product?.description ?? ''} maxLength={5000} rows={5} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-1 rounded-md border border-line p-4">
        <legend className="px-1 text-sm font-medium">Visibilidad</legend>
        <Checkbox name="is_active" label="Visible en el catálogo público" defaultChecked={product?.is_active ?? false} />
        <Checkbox name="is_new" label="Marcar como novedad" defaultChecked={product?.is_new ?? true} />
        <Checkbox name="is_featured" label="Destacar en la página de inicio" defaultChecked={product?.is_featured ?? false} />
      </fieldset>

      {state && !state.ok && <FormMessage tone="error">{state.error}</FormMessage>}
      {state?.ok && state.message && <FormMessage tone="success">{state.message}</FormMessage>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
