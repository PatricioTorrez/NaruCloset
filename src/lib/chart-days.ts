export type Day = { day: string; revenue: number; units: number };

/** Completa los días sin ventas con cero (se llama en el servidor, en tiempo de petición). */
export function fillDays(data: Day[], days: number, timeZone: string): Day[] {
  const byDay = new Map(data.map((d) => [d.day, d]));
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => {
    const key = new Date(now - (days - 1 - i) * 86400000).toLocaleDateString('en-CA', { timeZone });
    return byDay.get(key) ?? { day: key, revenue: 0, units: 0 };
  });
}

