'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { actionAdmin, NOT_AUTHORIZED, refreshCatalog } from './guard';
import { friendlyError, type ActionResult } from '@/lib/errors';
import {
  adjustSchema,
  colorStockSchema,
  fieldErrors,
  reasonSchema,
  reservationSchema,
  saleSchema,
  stockEntrySchema,
  uuid,
  paymentMethods,
} from '@/lib/validations/schemas';

/**
 * Todas las operaciones de inventario delegan en funciones PostgreSQL transaccionales
 * (supabase/migrations/…_inventory.sql). Aquí solo se valida la entrada y se invalida la caché.
 */

function toIso(local: string | undefined | null): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function registerStockEntry(input: z.input<typeof stockEntrySchema>): Promise<ActionResult<{ id: string }>> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = stockEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revise los datos de la entrada.', fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('register_stock_entry', {
    p_items: parsed.data.items,
    p_received_at: toIso(parsed.data.received_at),
    p_supplier: parsed.data.supplier ?? undefined,
    p_notes: parsed.data.notes ?? undefined,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, data: { id: data }, message: 'Entrada registrada. Las existencias se actualizaron.' };
}

/**
 * Inventario por color: crea (con 0) las tallas que falten y registra una entrada de mercancía
 * con la función transaccional; las existencias nunca se escriben directo.
 */
export async function addColorStock(input: z.input<typeof colorStockSchema>): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = colorStockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { product_id, color_id, items, notes } = parsed.data;
  const lines = items.filter((i) => i.quantity > 0);

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from('product_variants')
    .select('id, size_id, is_active')
    .eq('product_id', product_id)
    .eq('color_id', color_id);
  if (readError) return { ok: false, error: friendlyError(readError) };

  const bySize = new Map((existing ?? []).map((v) => [v.size_id, v]));
  const missing = lines.filter((l) => !bySize.has(l.size_id)).map((l) => ({ product_id, color_id, size_id: l.size_id }));
  if (missing.length) {
    const { data: created, error } = await supabase.from('product_variants').insert(missing).select('id, size_id, is_active');
    if (error) return { ok: false, error: friendlyError(error) };
    for (const v of created) bySize.set(v.size_id, v);
  }
  // Una talla que recibe mercancía vuelve a estar activa.
  const inactive = lines.map((l) => bySize.get(l.size_id)!).filter((v) => !v.is_active).map((v) => v.id);
  if (inactive.length) await supabase.from('product_variants').update({ is_active: true }).in('id', inactive);

  const { error } = await supabase.rpc('register_stock_entry', {
    p_items: lines.map((l) => ({ variant_id: bySize.get(l.size_id)!.id, quantity: l.quantity })),
    p_notes: notes ?? undefined,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  const total = lines.reduce((n, l) => n + l.quantity, 0);
  return { ok: true, message: `${total} pieza(s) agregada(s) al inventario.` };
}

export async function registerSale(input: z.input<typeof saleSchema>): Promise<ActionResult<{ id: string }>> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revise los datos de la venta.', fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('register_sale', {
    p_items: parsed.data.items,
    p_payment_method: parsed.data.payment_method ?? undefined,
    p_sold_at: toIso(parsed.data.sold_at),
    p_customer_reference: parsed.data.customer_reference ?? undefined,
    p_notes: parsed.data.notes ?? undefined,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, data: { id: data }, message: 'Venta registrada.' };
}

export async function cancelSale(saleId: string, reason: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const r = reasonSchema.safeParse(reason);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_sale', { p_sale_id: uuid.parse(saleId), p_reason: r.data });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: 'Venta cancelada. Las unidades regresaron al inventario.' };
}

const returnSchema = z.object({
  sale_id: uuid,
  reason: reasonSchema,
  items: z.array(z.object({ sale_item_id: uuid, quantity: z.number().int().min(1).max(10000) })).min(1, 'Indique qué se devuelve.'),
});

export async function registerReturn(input: z.input<typeof returnSchema>): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.rpc('register_return', {
    p_sale_id: parsed.data.sale_id,
    p_items: parsed.data.items,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: 'Devolución registrada.' };
}

export async function createReservation(input: z.input<typeof reservationSchema>): Promise<ActionResult<{ id: string }>> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revise los datos del apartado.', fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_reservation', {
    p_customer_name: parsed.data.customer_name,
    p_items: parsed.data.items,
    p_customer_contact: parsed.data.customer_contact ?? undefined,
    p_expires_at: toIso(parsed.data.expires_at),
    p_notes: parsed.data.notes ?? undefined,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, data: { id: data }, message: 'Apartado creado.' };
}

export async function confirmReservation(id: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const supabase = await createClient();
  const { error } = await supabase.rpc('confirm_reservation', { p_reservation_id: uuid.parse(id) });
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: 'Apartado confirmado.' };
}

export async function cancelReservation(id: string, reason: string): Promise<ActionResult> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const r = reasonSchema.safeParse(reason);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: uuid.parse(id), p_reason: r.data });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: 'Apartado cancelado. Las unidades quedaron libres.' };
}

export async function completeReservation(id: string, paymentMethod: string | null): Promise<ActionResult<{ saleId: string }>> {
  if (!(await actionAdmin())) return NOT_AUTHORIZED;
  const pm = z.enum(paymentMethods).nullable().safeParse(paymentMethod || null);
  if (!pm.success) return { ok: false, error: 'Método de pago inválido.' };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('complete_reservation', {
    p_reservation_id: uuid.parse(id),
    p_payment_method: pm.data ?? undefined,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, data: { saleId: data }, message: 'Apartado completado y registrado como venta.' };
}

export async function adjustStock(input: z.input<typeof adjustSchema>): Promise<ActionResult> {
  if (!(await actionAdmin(true))) return { ok: false, error: 'Solo el owner puede ajustar el inventario.' };
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.rpc('adjust_stock', {
    p_variant_id: parsed.data.variant_id,
    p_new_on_hand: parsed.data.new_on_hand,
    p_reason: parsed.data.reason,
    p_type: parsed.data.type,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: 'Ajuste registrado en el historial.' };
}

const stockEditSchema = z.object({
  items: z
    .array(z.object({ variant_id: uuid, new_on_hand: z.coerce.number().int('Use números enteros.').min(0, 'No puede ser negativo.').max(100000) }))
    .min(1)
    .max(100),
  reason: reasonSchema,
  type: z.enum(['manual_adjustment', 'admin_correction']),
});

/** Corrige las existencias de varias tallas a la vez (solo owner). Todo o nada; queda en el historial. */
export async function editColorStock(input: z.input<typeof stockEditSchema>): Promise<ActionResult> {
  if (!(await actionAdmin(true))) return { ok: false, error: 'Solo el owner puede editar existencias.' };
  const parsed = stockEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('adjust_stock_many', {
    p_items: parsed.data.items,
    p_reason: parsed.data.reason,
    p_type: parsed.data.type,
  });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true, message: data === 1 ? 'Existencias actualizadas (1 talla).' : `Existencias actualizadas (${data} tallas).` };
}
