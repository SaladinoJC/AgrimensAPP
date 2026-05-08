import React, { useState, useCallback, useRef } from 'react';
import { sincronizarPorFechaHeadless } from './headlessAdapter';
import { CredencialesArba, RangoFechas, SyncError } from './types';
import { parseTramitesFromPorFechaHtml } from './parserDsisic';
import { normalizarRango } from './sincronizacion';
import { ArbaWebView } from '../services/ArbaWebView';

export type SyncResult =
  | { ok: true; rows: any[] }
  | { ok: false; error: SyncError };

export function useSincronizador() {
  const [webviewState, setWebviewState] = useState({ 
    active: false, 
    cuit: '', 
    cit: '', 
    rango: { desde: '', hasta: '' } 
  });
  
  const resolvePromise = useRef<((res: SyncResult) => void) | null>(null);

  const sync = useCallback(async (creds: CredencialesArba, rangoInput?: Partial<RangoFechas>): Promise<SyncResult> => {
    const rango = normalizarRango(rangoInput);
    
    try {
      // Intentar primero con el adapter headless (más rápido y en background)
      const rows = await sincronizarPorFechaHeadless(creds, rango);
      return { ok: true, rows };
    } catch (e: any) {
      const err = e instanceof SyncError ? e : new SyncError('TECNICO', String(e));
      
      // Si el error es TECNICO (falla de fetch, cookies o bloqueado por ARBA), 
      // hacemos fallback inyectando y montando el WebView
      if (err.kind === 'TECNICO') {
        return new Promise((resolve) => {
          resolvePromise.current = resolve;
          setWebviewState({ active: true, cuit: creds.cuit, cit: creds.cit, rango });
        });
      }
      
      // Si es otro tipo de error (ej: credenciales o parseo), no usamos WebView
      return { ok: false, error: err };
    }
  }, []);

  const onWebviewComplete = useCallback((html: string, error?: string) => {
    setWebviewState(prev => ({ ...prev, active: false }));
    const resolve = resolvePromise.current;
    resolvePromise.current = null;
    
    if (!resolve) return;

    if (error) {
      resolve({ ok: false, error: new SyncError('TECNICO', error) });
      return;
    }

    try {
      const rows = parseTramitesFromPorFechaHtml(html);
      resolve({ ok: true, rows });
    } catch (e) {
      resolve({ ok: false, error: new SyncError('TECNICO', String(e)) });
    }
  }, []);

  const SincronizadorComponent = webviewState.active ? (
    <ArbaWebView 
      cuit={webviewState.cuit} 
      cit={webviewState.cit} 
      rango={webviewState.rango} 
      onSyncComplete={onWebviewComplete} 
    />
  ) : null;

  return { sync, SincronizadorComponent };
}
