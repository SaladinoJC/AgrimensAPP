import { RangoFechas } from '@/store/store.types';

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}


export function rangoUltimosCincoMeses(): RangoFechas {
  const today = new Date();
  const cincoMesesAtras = new Date();
  // Restamos 5 meses a la fecha actual
  cincoMesesAtras.setMonth(today.getMonth() - 5);
  return { 
    desde: isoDate(cincoMesesAtras), 
    hasta: isoDate(today) 
  };
}

export function normalizarRango(input?: Partial<RangoFechas>): RangoFechas {
  const def = rangoUltimosCincoMeses();
  const desde = (input?.desde ?? def.desde).trim();
  const hasta = (input?.hasta ?? def.hasta).trim();
  return { desde, hasta };
}