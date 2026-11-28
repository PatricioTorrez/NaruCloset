import { describe, expect, it } from 'vitest';
import { colorStockSchema, productColorsSchema, productSchema, saleSchema, settingsSchema, stockEntrySchema } from '@/lib/validations/schemas';

const base = {
  name: 'Sudadera básica',
  slug: 'sudadera-basica',
  description: '',
  category_id: 'e95ad6ec-1b35-40b5-b811-8713fc66be51',
  audience: 'unisex',
  price: '350',
};

describe('productSchema (datos tal como llegan del FormData)', () => {
  it('acepta la casilla de novedad sin marcar y no toca la visibilidad (se decide en Inventario)', () => {
    const r = productSchema.safeParse({ ...base, is_active: 'on', is_featured: 'on' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toMatchObject({ is_new: false, sale_price: null, price: 350 });
      expect(r.data).not.toHaveProperty('is_active');
      expect(r.data).not.toHaveProperty('is_featured');
    }
  });

  it('rechaza un precio promocional mayor o igual al regular, en el campo correcto', () => {
    const r = productSchema.safeParse({ ...base, sale_price: '400' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(['sale_price']);
  });

  it('rechaza slugs con mayúsculas o espacios y precios en cero', () => {
    expect(productSchema.safeParse({ ...base, slug: 'Sudadera Básica' }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, price: '0' }).success).toBe(false);
  });
});

describe('operaciones', () => {
  const v = '0b0f7d2e-3c1a-4c55-9d9e-2f4b6a7c8d90';
  it('venta sin método de pago y entrada sin costo son válidas', () => {
    expect(saleSchema.safeParse({ items: [{ variant_id: v, quantity: 1, unit_price: 100 }] }).success).toBe(true);
    expect(stockEntrySchema.safeParse({ items: [{ variant_id: v, quantity: 3 }] }).success).toBe(true);
  });
  it('rechaza cantidades no enteras o en cero', () => {
    expect(saleSchema.safeParse({ items: [{ variant_id: v, quantity: 0, unit_price: 1 }] }).success).toBe(false);
    expect(stockEntrySchema.safeParse({ items: [{ variant_id: v, quantity: 1.5 }] }).success).toBe(false);
  });
});

describe('settingsSchema', () => {
  const s = {
    store_name: 'Naru Closet',
    instagram_handle: '@naru.closet',
    whatsapp_number: '',
    contact_email: '',
    low_stock_threshold: '2',
    reservation_default_days: '',
  };
  it('normaliza Instagram y acepta casillas sin marcar', () => {
    const r = settingsSchema.safeParse(s);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ instagram_handle: 'naru.closet', whatsapp_enabled: false, show_sold_out_products: false });
  });
  it('exige número para activar WhatsApp', () => {
    const r = settingsSchema.safeParse({ ...s, whatsapp_enabled: 'on' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(['whatsapp_number']);
  });
  it('acepta WhatsApp en formato internacional con espacios', () => {
    const r = settingsSchema.safeParse({ ...s, whatsapp_enabled: 'on', whatsapp_number: '+52 1 55 1234 5678' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.whatsapp_number).toBe('+5215512345678');
  });
});

describe('colores e inventario por color', () => {
  const id = '0b0f7d2e-3c1a-4c55-9d9e-2f4b6a7c8d90';
  it('un color sin precio propio queda en null; con precio se redondea', () => {
    const r = productColorsSchema.safeParse({ product_id: id, colors: [{ color_id: id, price: '' }, { new_color: { name: 'Rojo vino', hex: '#7A2E35' }, price: '599.999' }] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.colors.map((c) => c.price)).toEqual([null, 600]);
  });
  it('rechaza un color nuevo con tono inválido', () => {
    expect(productColorsSchema.safeParse({ product_id: id, colors: [{ new_color: { name: 'X', hex: 'rojo' } }] }).success).toBe(false);
  });
  it('exige al menos una cantidad mayor que cero', () => {
    expect(colorStockSchema.safeParse({ product_id: id, color_id: id, items: [{ size_id: id, quantity: 0 }] }).success).toBe(false);
    expect(colorStockSchema.safeParse({ product_id: id, color_id: id, items: [{ size_id: id, quantity: '3' }] }).success).toBe(true);
  });
});
