'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { actionAdmin, NOT_AUTHORIZED, refreshCatalog } from './guard';
import { friendlyError, type ActionResult } from '@/lib/errors';
import {
  categorySchema,
  colorSchema,
  fieldErrors,
  productSchema,
  sizeSchema,
  uuid,
  variantsCreateSchema,
} from '@/lib/validations/schemas';
import { STORAGE_BUCKET } from '@/lib/env';

const formObject = (fd: FormData) => Object.fromEntries(fd.entries());

// ───────────────────────── Categorías ─────────────────────────
export async function saveCategory(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const id = fd.get('id');
  const parsed = categorySchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, error: 'Revise los campos marcados.', fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } =
    typeof id === 'string' && id
      ? await supabase.from('categories').update(parsed.data).eq('id', uuid.parse(id))
      : await supabase.from('categories').insert(parsed.data);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: id ? 'Categoría actualizada.' : 'Categoría creada.' };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', uuid.parse(id));
  if (error) {
    return {
      ok: false,
      error: error.code === '23503' ? 'La categoría tiene productos. Desactívela o mueva sus productos primero.' : friendlyError(error),
    };
  }
  refreshCatalog();
  return { ok: true, message: 'Categoría eliminada.' };
}

// ───────────────────────── Colores y tallas ─────────────────────────
export async function saveColor(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = colorSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, error: 'Revise los campos marcados.', fieldErrors: fieldErrors(parsed.error) };
  const id = fd.get('id');
  const supabase = await createClient();
  const { error } =
    typeof id === 'string' && id
      ? await supabase.from('colors').update(parsed.data).eq('id', uuid.parse(id))
      : await supabase.from('colors').insert(parsed.data);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: 'Color guardado.' };
}

export async function saveSize(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = sizeSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, error: 'Revise los campos marcados.', fieldErrors: fieldErrors(parsed.error) };
  const id = fd.get('id');
  const supabase = await createClient();
  const { error } =
    typeof id === 'string' && id
      ? await supabase.from('sizes').update(parsed.data).eq('id', uuid.parse(id))
      : await supabase.from('sizes').insert(parsed.data);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: 'Talla guardada.' };
}

export async function toggleAttribute(kind: 'colors' | 'sizes', id: string, isActive: boolean): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { error } = await supabase.from(kind).update({ is_active: isActive }).eq('id', uuid.parse(id));
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true };
}

export async function deleteAttribute(kind: 'colors' | 'sizes', id: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { error } = await supabase.from(kind).delete().eq('id', uuid.parse(id));
  if (error) {
    return {
      ok: false,
      error: error.code === '23503' ? 'Está en uso por variantes. Desactívelo en lugar de eliminarlo.' : friendlyError(error),
    };
  }
  refreshCatalog();
  return { ok: true, message: 'Eliminado.' };
}

// ───────────────────────── Productos ─────────────────────────
export async function saveProduct(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = productSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, error: 'Revise los campos marcados.', fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const rawId = fd.get('id');
  const id = typeof rawId === 'string' && rawId ? uuid.parse(rawId) : null;

  if (id) {
    const { data: before } = await supabase.from('products').select('slug').eq('id', id).single();
    const { error } = await supabase.from('products').update(parsed.data).eq('id', id);
    if (error) {
      return error.code === '23505'
        ? { ok: false, error: 'Ese slug ya lo usa otro producto.', fieldErrors: { slug: ['Ya está en uso.'] } }
        : { ok: false, error: friendlyError(error) };
    }
    refreshCatalog(before?.slug, parsed.data.slug);
    return { ok: true, message: 'Producto guardado.' };
  }

  const { data, error } = await supabase.from('products').insert(parsed.data).select('id').single();
  if (error) {
    return error.code === '23505'
      ? { ok: false, error: 'Ese slug ya lo usa otro producto.', fieldErrors: { slug: ['Ya está en uso.'] } }
      : { ok: false, error: friendlyError(error) };
  }
  refreshCatalog();
  redirect(`/admin/productos/${data.id}?creado=1`);
}

export async function setProductArchived(id: string, archived: boolean): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .update(archived ? { archived_at: new Date().toISOString(), is_active: false } : { archived_at: null })
    .eq('id', uuid.parse(id))
    .select('slug')
    .single();
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog(data.slug);
  return { ok: true, message: archived ? 'Producto archivado.' : 'Producto restaurado (inactivo).' };
}

/** Elimina un producto solo si no tiene historial; si lo tiene, la base lo impide y se sugiere archivar. */
export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const productId = uuid.parse(id);
  const supabase = await createClient();
  const { data: images } = await supabase.from('product_images').select('storage_path, thumb_path').eq('product_id', productId);
  const { data, error } = await supabase.from('products').delete().eq('id', productId).select('slug').maybeSingle();
  if (error) {
    return {
      ok: false,
      error:
        error.code === '23503'
          ? 'Este producto tiene movimientos, ventas o apartados. Archívelo para conservar el historial.'
          : friendlyError(error),
    };
  }
  if (images?.length) {
    await supabase.storage.from(STORAGE_BUCKET).remove(images.flatMap((i) => [i.storage_path, i.thumb_path]));
  }
  refreshCatalog(data?.slug);
  redirect('/admin/productos?eliminado=1');
}

// ───────────────────────── Variantes ─────────────────────────
export async function createVariants(input: z.input<typeof variantsCreateSchema>): Promise<ActionResult<{ created: number }>> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = variantsCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: z.prettifyError(parsed.error) };
  const { product_id, color_ids, size_ids } = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('product_variants')
    .select('color_id, size_id')
    .eq('product_id', product_id);
  const taken = new Set((existing ?? []).map((v) => `${v.color_id}:${v.size_id}`));

  const rows = color_ids.flatMap((color_id) =>
    size_ids.filter((size_id) => !taken.has(`${color_id}:${size_id}`)).map((size_id) => ({ product_id, color_id, size_id })),
  );
  if (rows.length === 0) return { ok: false, error: 'Esas combinaciones ya existen.' };

  const { error } = await supabase.from('product_variants').insert(rows);
  if (error) return { ok: false, error: friendlyError(error) };
  const { data: p } = await supabase.from('products').select('slug').eq('id', product_id).single();
  refreshCatalog(p?.slug);
  return { ok: true, data: { created: rows.length }, message: `${rows.length} variante(s) creada(s) con 0 existencias.` };
}

export async function updateVariant(id: string, values: { sku?: string | null; is_active?: boolean }): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const sku = values.sku === undefined ? undefined : values.sku?.trim() || null;
  if (sku && sku.length > 60) return { ok: false, error: 'El SKU es demasiado largo.' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_variants')
    .update({ ...(sku !== undefined && { sku }), ...(values.is_active !== undefined && { is_active: values.is_active }) })
    .eq('id', uuid.parse(id))
    .select('product:products(slug)')
    .single();
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog(data.product?.slug);
  return { ok: true };
}

export async function deleteVariant(id: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { error } = await supabase.from('product_variants').delete().eq('id', uuid.parse(id));
  if (error) {
    return {
      ok: false,
      error: error.code === '23503' ? 'La variante tiene historial. Desactívela en lugar de eliminarla.' : friendlyError(error),
    };
  }
  refreshCatalog();
  return { ok: true, message: 'Variante eliminada.' };
}

// ───────────────────────── Fotografías ─────────────────────────
const imageRecordSchema = z.object({
  product_id: uuid,
  storage_path: z.string().regex(/^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/),
  thumb_path: z.string().regex(/^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}_thumb\.(webp|jpg)$/),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  alt_text: z.string().trim().max(200).nullable().optional(),
  color_id: uuid.nullable().optional(),
});

/** Registra los metadatos de una foto ya subida a Storage desde el navegador. */
export async function addProductImage(input: z.input<typeof imageRecordSchema>): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = imageRecordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos de imagen inválidos.' };
  if (!parsed.data.storage_path.startsWith(`products/${parsed.data.product_id}/`)) {
    return { ok: false, error: 'La ruta no corresponde al producto.' };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('product_images')
    .select('sort_order, is_primary')
    .eq('product_id', parsed.data.product_id);
  const hasPrimary = (existing ?? []).some((i) => i.is_primary);
  const nextOrder = Math.max(-1, ...(existing ?? []).map((i) => i.sort_order)) + 1;

  const { error } = await supabase.from('product_images').insert({
    ...parsed.data,
    alt_text: parsed.data.alt_text || null,
    color_id: parsed.data.color_id || null,
    sort_order: nextOrder,
    is_primary: !hasPrimary,
  });
  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([parsed.data.storage_path, parsed.data.thumb_path]);
    return { ok: false, error: friendlyError(error) };
  }
  await refreshProductById(supabase, parsed.data.product_id);
  return { ok: true, message: 'Fotografía agregada.' };
}

export async function updateProductImage(
  id: string,
  values: { alt_text?: string | null; color_id?: string | null },
): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const patch: { alt_text?: string | null; color_id?: string | null } = {};
  if (values.alt_text !== undefined) patch.alt_text = values.alt_text?.trim().slice(0, 200) || null;
  if (values.color_id !== undefined) patch.color_id = values.color_id ? uuid.parse(values.color_id) : null;
  const { data, error } = await supabase.from('product_images').update(patch).eq('id', uuid.parse(id)).select('product_id').single();
  if (error) return { ok: false, error: friendlyError(error) };
  await refreshProductById(supabase, data.product_id);
  return { ok: true };
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const pid = uuid.parse(productId);
  // Quitar la principal actual y luego marcar la nueva (índice único parcial).
  const off = await supabase.from('product_images').update({ is_primary: false }).eq('product_id', pid).eq('is_primary', true);
  if (off.error) return { ok: false, error: friendlyError(off.error) };
  const on = await supabase.from('product_images').update({ is_primary: true }).eq('id', uuid.parse(imageId)).eq('product_id', pid);
  if (on.error) return { ok: false, error: friendlyError(on.error) };
  await refreshProductById(supabase, pid);
  return { ok: true, message: 'Fotografía principal actualizada.' };
}

export async function reorderImages(productId: string, orderedIds: string[]): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const pid = uuid.parse(productId);
  const ids = z.array(uuid).max(50).parse(orderedIds);
  const supabase = await createClient();
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase.from('product_images').update({ sort_order: index }).eq('id', id).eq('product_id', pid);
    if (error) return { ok: false, error: friendlyError(error) };
  }
  await refreshProductById(supabase, pid);
  return { ok: true };
}

export async function deleteProductImage(id: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', uuid.parse(id))
    .select('product_id, storage_path, thumb_path, is_primary')
    .single();
  if (error) return { ok: false, error: friendlyError(error) };
  await supabase.storage.from(STORAGE_BUCKET).remove([data.storage_path, data.thumb_path]);

  if (data.is_primary) {
    const { data: next } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', data.product_id)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from('product_images').update({ is_primary: true }).eq('id', next.id);
  }
  await refreshProductById(supabase, data.product_id);
  return { ok: true, message: 'Fotografía eliminada.' };
}

async function refreshProductById(supabase: Awaited<ReturnType<typeof createClient>>, productId: string) {
  const { data } = await supabase.from('products').select('slug').eq('id', productId).single();
  refreshCatalog(data?.slug);
}
