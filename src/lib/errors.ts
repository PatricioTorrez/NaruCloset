/**
 * Traduce errores de Supabase/PostgreSQL a mensajes comprensibles en español.
 * El detalle técnico se registra en el servidor; al usuario solo llega el mensaje.
 */
type PgLikeError = { code?: string; message?: string; details?: string | null } | null | undefined;

const MESSAGES: Record<string, string> = {
  not_authorized: 'No tiene permiso para realizar esta acción.',
  insufficient_stock: 'No hay existencias suficientes para completar la operación.',
  invalid_state: 'La operación no es válida en el estado actual.',
  not_found: 'El registro ya no existe.',
  stock_direct_write: 'Las existencias solo se modifican con entradas, ventas, apartados o ajustes.',
  movement_immutable: 'El historial de movimientos no se puede modificar.',
  last_owner: 'Debe existir al menos un owner activo.',
};

export function friendlyError(error: PgLikeError, fallback = 'Ocurrió un error. Intente de nuevo.'): string {
  if (!error) return fallback;
  const message = error.message ?? '';

  if (message === 'invalid_input' && error.details) return error.details;
  if (message in MESSAGES) {
    // Para invalid_state/not_found el detalle ya está redactado en español.
    if ((message === 'invalid_state' || message === 'not_found') && error.details) return error.details;
    return MESSAGES[message];
  }

  switch (error.code) {
    case '23505':
      return 'Ya existe un registro con esos datos (nombre, slug o combinación duplicada).';
    case '23503':
      return 'No se puede eliminar: el registro está en uso o tiene historial. Archívelo en su lugar.';
    case '23514':
      return 'Algún valor no cumple las reglas permitidas.';
    case '42501':
      return MESSAGES.not_authorized;
    case 'PGRST116':
      return MESSAGES.not_found;
  }
  return fallback;
}

/** Resultado estándar de las Server Actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
