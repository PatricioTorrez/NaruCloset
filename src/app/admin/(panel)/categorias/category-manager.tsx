'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { saveCategory, deleteCategory } from '@/lib/actions/catalog';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FormMessage, Input, Textarea } from '@/components/ui/form';
import { Badge, EmptyState } from '@/components/ui/misc';
import { ConfirmAction } from '@/components/ui/confirm';
import { Cell, DataTable, Panel, Row } from '@/components/admin/page-header';
import { slugify } from '@/lib/format';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const router = useRouter();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <DataTable
        head={['Nombre', 'Slug', 'Productos', 'Estado', '']}
        empty={categories.length === 0 && <EmptyState title="Sin categorías" description="Cree la primera con el formulario." />}
      >
        {categories.map((c) => (
          <Row key={c.id}>
            <Cell label="Nombre" className="font-medium">{c.name}</Cell>
            <Cell label="Slug" className="text-muted">{c.slug}</Cell>
            <Cell label="Productos" className="tabular-nums">{c.product_count}</Cell>
            <Cell label="Estado">
              {c.is_active ? <Badge tone="success">Activa</Badge> : <Badge>Oculta</Badge>}
            </Cell>
            <Cell label="Acciones" className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                  <Pencil className="size-4" aria-hidden /> Editar
                </Button>
                <ConfirmAction
                  trigger="Eliminar"
                  triggerVariant="ghost"
                  title={`Eliminar «${c.name}»`}
                  description="Solo se puede eliminar si no tiene productos. Si los tiene, desactívela."
                  confirmLabel="Eliminar"
                  action={() => deleteCategory(c.id)}
                  onDone={() => router.refresh()}
                />
              </div>
            </Cell>
          </Row>
        ))}
      </DataTable>

      <Panel title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <CategoryForm key={editing?.id ?? 'new'} category={editing} onDone={() => setEditing(null)} />
      </Panel>
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: Category | null; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveCategory, null);
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      if (!category) formRef.current?.reset();
      onDone();
    }
  }, [state, router, category, onDone]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Nombre" htmlFor="cat-name" error={fe?.name?.[0]}>
        <Input
          id="cat-name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          maxLength={60}
          aria-invalid={Boolean(fe?.name)}
        />
      </Field>
      <Field label="Slug (URL)" htmlFor="cat-slug" error={fe?.slug?.[0]} hint="Se usa en el filtro: /catalogo?categoria=slug">
        <Input
          id="cat-slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
          maxLength={80}
          aria-invalid={Boolean(fe?.slug)}
        />
      </Field>
      <Field label="Descripción" htmlFor="cat-desc" optional error={fe?.description?.[0]}>
        <Textarea id="cat-desc" name="description" defaultValue={category?.description ?? ''} maxLength={500} />
      </Field>
      <Field label="Orden" htmlFor="cat-order" hint="Menor número aparece primero.">
        <Input id="cat-order" name="sort_order" type="number" min={0} max={9999} defaultValue={category?.sort_order ?? 0} />
      </Field>
      <Checkbox name="is_active" label="Visible en el sitio" defaultChecked={category?.is_active ?? true} />
      {state && !state.ok && <FormMessage tone="error">{state.error}</FormMessage>}
      {state?.ok && state.message && <FormMessage tone="success">{state.message}</FormMessage>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? 'Guardando…' : category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
        {category && (
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
