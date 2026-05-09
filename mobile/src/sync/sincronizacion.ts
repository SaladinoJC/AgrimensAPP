import { RangoFechas } from './types';

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function rangoUltimoAnio(): RangoFechas {
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(today.getFullYear() - 1);
  return { desde: isoDate(yearAgo), hasta: isoDate(today) };
}

export function normalizarRango(input?: Partial<RangoFechas>): RangoFechas {
  const def = rangoUltimoAnio();
  const desde = (input?.desde ?? def.desde).trim();
  const hasta = (input?.hasta ?? def.hasta).trim();
  return { desde, hasta };
}