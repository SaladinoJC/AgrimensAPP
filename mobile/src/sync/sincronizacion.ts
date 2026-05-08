import { sincronizarPorFechaHeadless } from './headlessAdapter';
import { CredencialesArba, RangoFechas, SyncError } from './types';

export type SyncAdapterPreferencia = 'HEADLESS_PRIMERO';

export type SyncResult =
  | { ok: true; rows: any[] }
  | { ok: false; error: SyncError; sugerirWebView: boolean };

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

export async function sincronizarPorFecha(
  creds: CredencialesArba,
  rango: RangoFechas,
  preferencia: SyncAdapterPreferencia = 'HEADLESS_PRIMERO'
): Promise<SyncResult> {
  if (preferencia !== 'HEADLESS_PRIMERO') {
    return {
      ok: false,
      error: new SyncError('TECNICO', 'Preferencia de sincronización no soportada.'),
      sugerirWebView: true,
    };
  }

  try {
    const rows = await sincronizarPorFechaHeadless(creds, rango);
    return { ok: true, rows };
  } catch (e: any) {
    const err = e instanceof SyncError ? e : new SyncError('TECNICO', String(e));
    const sugerirWebView = err.kind === 'TECNICO';
    return { ok: false, error: err, sugerirWebView };
  }
}

