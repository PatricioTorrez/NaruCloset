import { z } from 'zod';

/** Esquemas Zod compartidos por formularios (cliente) y Server Actions (servidor). */

const trimmed = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null));

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Escriba el slug.')
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones (ej. sudadera-basica).');

const money = z.coerce
  .number({ error: 'Escriba un número.' })
  .finite()
  .min(0, 'No puede ser negativo.')
  .max(999999.99, 'El valor es demasiado alto.')
  .transform((v) => Math.round(v * 100) / 100);

const checkbox = z
  .union([z.literal('on'), z.literal('true'), z.boolean(), z.undefined(), z.null()])
  .transform((v) => v === 'on' || v === 'true' || v === true);

export const uuid = z.uuid('Identificador inválido.');

export const categorySchema = z.object({
  name: trimmed(60).min(1, 'Escriba el nombre.'),
  slug: slugSchema,
  description: optionalText(500),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: checkbox,
});

export const colorSchema = z.object({
  name: trimmed(40).min(1, 'Escriba el nombre.'),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (#RRGGBB).'),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const sizeSchema = z.object({
  name: trimmed(20).min(1, 'Escriba la talla.'),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const productSchema = z
  .object({
    name: trimmed(120).min(1, 'Escriba el nombre.'),
    slug: slugSchema,
    description: optionalText(5000),
    category_id: uuid,
    audience: z.enum(['women', 'men', 'unisex'], { error: 'Elija la colección.' }),
    price: money.refine((v) => v > 0, 'El precio debe ser mayor que cero.'),
    sale_price: z
      .union([z.literal(''), z.undefined(), z.null(), money])
      .transform((v) => (v === '' || v === undefined || v === null || v === 0 ? null : v)),
    is_active: checkbox,
    is_new: checkbox,
    is_featured: checkbox,
  })
  .refine((p) => p.sale_price === null || p.sale_price < p.price, {
    path: ['sale_price'],
    message: 'El precio promocional debe ser menor que el precio regular.',
  });

export const variantsCreateSchema = z.object({
  product_id: uuid,
  color_ids: z.array(uuid).min(1, 'Elija al menos un color.').max(30),
  size_ids: z.array(uuid).min(1, 'Elija al menos una talla.').max(30),
});

const qty = z.coerce.number().int('Use números enteros.').min(1, 'Mínimo 1.').max(10000);

export const stockEntrySchema = z.object({
  received_at: z.string().optional(),
  supplier: optionalText(120),
  notes: optionalText(1000),
  items: z
    .array(
      z.object({
        variant_id: uuid,
        quantity: qty,
        unit_cost: z
          .union([z.literal(''), z.undefined(), z.null(), money])
          .transform((v) => (v === '' || v === undefined || v === null ? null : v)),
      }),
    )
    .min(1, 'Agregue al menos una variante.')
    .max(100),
});

export const paymentMethods = ['cash', 'transfer', 'card', 'other'] as const;

export const saleSchema = z.object({
  sold_at: z.string().optional(),
  payment_method: z
    .union([z.enum(paymentMethods), z.literal(''), z.undefined()])
    .transform((v) => (v ? v : null)),
  customer_reference: optionalText(120),
  notes: optionalText(1000),
  items: z
    .array(z.object({ variant_id: uuid, quantity: qty, unit_price: money }))
    .min(1, 'Agregue al menos un producto.')
    .max(100),
});

export const reservationSchema = z.object({
  customer_name: trimmed(120).min(1, 'Escriba el nombre o referencia del cliente.'),
  customer_contact: optionalText(120),
  expires_at: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  notes: optionalText(1000),
  items: z
    .array(z.object({ variant_id: uuid, quantity: qty }))
    .min(1, 'Agregue al menos un producto.')
    .max(100),
});

export const reasonSchema = z.string().trim().min(3, 'Escriba el motivo (mínimo 3 caracteres).').max(500);

export const adjustSchema = z.object({
  variant_id: uuid,
  new_on_hand: z.coerce.number().int().min(0, 'No puede ser negativo.').max(100000),
  reason: reasonSchema,
  type: z.enum(['manual_adjustment', 'admin_correction']),
});

export const settingsSchema = z
  .object({
    store_name: trimmed(80).min(1, 'Escriba el nombre de la tienda.'),
    slogan: optionalText(160),
    description: optionalText(500),
    about_text: optionalText(5000),
    instagram_handle: z
      .string()
      .trim()
      .transform((v) => v.replace(/^@/, ''))
      .refine((v) => v === '' || /^[A-Za-z0-9._]{1,30}$/.test(v), 'Usuario de Instagram inválido.')
      .transform((v) => (v ? v : null)),
    whatsapp_enabled: checkbox,
    whatsapp_number: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s()-]/g, ''))
      .refine((v) => v === '' || /^\+[1-9][0-9]{7,14}$/.test(v), 'Use formato internacional, ej. +5215512345678.')
      .transform((v) => (v ? v : null)),
    contact_email: z
      .string()
      .trim()
      .refine((v) => v === '' || z.email().safeParse(v).success, 'Correo inválido.')
      .transform((v) => (v ? v : null)),
    contact_phone: optionalText(30),
    show_sold_out_products: checkbox,
    low_stock_threshold: z.coerce.number().int().min(0).max(100),
    reservations_hold_stock: checkbox,
    reservation_default_days: z
      .union([z.literal(''), z.coerce.number().int().min(1).max(90)])
      .transform((v) => (v === '' ? null : v)),
    delivery_info: optionalText(2000),
    pickup_info: optionalText(2000),
  })
  .refine((s) => !s.whatsapp_enabled || s.whatsapp_number, {
    path: ['whatsapp_number'],
    message: 'Para activar WhatsApp escriba el número.',
  });

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
