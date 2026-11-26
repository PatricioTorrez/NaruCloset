const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  return mxn.format(typeof value === 'string' ? Number(value) : value);
}

export const DEFAULT_TIMEZONE = 'America/Mexico_City';

export function formatDateTime(value: string | Date, timeZone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(
    typeof value === 'string' ? new Date(value) : value,
  );
}

export function formatDate(value: string | Date, timeZone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone }).format(
    typeof value === 'string' ? new Date(value) : value,
  );
}

/** Convierte un texto en slug URL: "Sudadera Básica" → "sudadera-basica". */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** true si la fecha ya pasó. */
export function isPast(value: string | null | undefined): boolean {
  return Boolean(value) && new Date(value as string).getTime() < Date.now();
}

export function effectivePrice(price: number, salePrice: number | null | undefined): number {
  return salePrice ?? price;
}

/** Enlace de WhatsApp con mensaje prellenado. El número va en formato E.164 (+52...). */
export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
}

export const AUDIENCE_LABEL = { women: 'Mujer', men: 'Hombre', unisex: 'Unisex' } as const;

export const PAYMENT_LABEL = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  other: 'Otro',
} as const;

export const SALE_STATUS_LABEL = {
  completed: 'Completada',
  partially_returned: 'Devolución parcial',
  returned: 'Devuelta',
  cancelled: 'Cancelada',
} as const;

export const RESERVATION_STATUS_LABEL = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  expired: 'Vencido',
} as const;

export const MOVEMENT_LABEL = {
  stock_entry: 'Entrada de mercancía',
  sale: 'Venta',
  sale_cancellation: 'Cancelación de venta',
  return: 'Devolución',
  reservation: 'Apartado',
  reservation_release: 'Liberación de apartado',
  manual_adjustment: 'Ajuste manual',
  admin_correction: 'Corrección administrativa',
} as const;
