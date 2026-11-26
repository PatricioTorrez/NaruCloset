'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAttribute, saveColor, saveSize, toggleAttribute } from '@/lib/actions/catalog';
import { Button } from '@/components/ui/button';
import { Field, FormMessage, Input } from '@/components/ui/form';
import { Badge, EmptyState } from '@/components/ui/misc';
import { ConfirmAction } from '@/components/ui/confirm';
import { Panel } from '@/components/admin/page-header';

type Item = { id: string; name: string; hex: string | null; sort_order: number; is_active: boolean };

export function AttributeManager({ kind, items }: { kind: 'colors' | 'sizes'; items: Item[] }) {
  const isColor = kind === 'colors';
  const [editing, setEditing] = useState<Item | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const save = isColor ? saveColor : saveSize;
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof save>> | null, fd: FormData) => {
    const result = await save(prev, fd);
    if (result.ok) {
      formRef.current?.reset();
      setEditing(null);
      router.refresh();
    }
    return result;
  }, null);
  const [, startTransition] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Panel title={isColor ? 'Colores' : 'Tallas'}>
      <form ref={formRef} action={action} key={editing?.id ?? 'new'} className="mb-6 flex flex-wrap items-end gap-3">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <Field label={isColor ? 'Nombre del color' : 'Talla'} htmlFor={`${kind}-name`} error={fe?.name?.[0]} className="min-w-36 flex-1">
          <Input
            id={`${kind}-name`}
            name="name"
            defaultValue={editing?.name}
            required
            maxLength={isColor ? 40 : 20}
            placeholder={isColor ? 'Ej. Gris jaspe' : 'Ej. M o 30'}
          />
        </Field>
        {isColor && (
          <Field label="Color" htmlFor="colors-hex" error={fe?.hex?.[0]}>
            <input
              id="colors-hex"
              name="hex"
              type="color"
              defaultValue={editing?.hex ?? '#a68d7b'}
              className="h-11 w-16 cursor-pointer rounded-md border border-line bg-white p-1"
            />
          </Field>
        )}
        <Field label="Orden" htmlFor={`${kind}-order`}>
          <Input id={`${kind}-order`} name="sort_order" type="number" min={0} max={9999} defaultValue={editing?.sort_order ?? items.length} className="w-20" />
        </Field>
        <Button type="submit" disabled={pending}>
          {editing ? 'Guardar' : 'Agregar'}
        </Button>
        {editing && (
          <Button variant="ghost" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        )}
      </form>
      {state && !state.ok && <FormMessage tone="error">{state.error}</FormMessage>}
      {toggleError && <FormMessage tone="error">{toggleError}</FormMessage>}

      {items.length === 0 ? (
        <EmptyState
          title={isColor ? 'Sin colores' : 'Sin tallas'}
          description={isColor ? 'Agregue los colores de sus prendas.' : 'Agregue tallas como XS, S, M, 28, 30 o Única.'}
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
              {isColor && (
                <span className="size-6 shrink-0 rounded-full border border-line" style={{ backgroundColor: item.hex ?? undefined }} aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {!item.is_active && <Badge>Inactivo</Badge>}
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      const r = await toggleAttribute(kind, item.id, !item.is_active);
                      setToggleError(r.ok ? null : r.error);
                      router.refresh();
                    })
                  }
                >
                  {item.is_active ? 'Desactivar' : 'Activar'}
                </Button>
                <ConfirmAction
                  trigger="Eliminar"
                  triggerVariant="ghost"
                  title={`Eliminar «${item.name}»`}
                  description="Solo es posible si ninguna variante lo usa."
                  confirmLabel="Eliminar"
                  action={() => deleteAttribute(kind, item.id)}
                  onDone={() => router.refresh()}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
