import React, { useState, useCallback, useRef } from 'react';
import { sincronizarPorFechaHeadless } from '@/services/sync/headlessAdapter';
import { CredencialesArba, RangoFechas, SyncError } from '@/services/sync/types';
import { parseTramitesFromPorFechaHtml } from '@/services/sync/parserDsisic';
import { normalizarRango } from '@/services/sync/sincronizacion';
import { ArbaWebView } from '@/components/arba/ArbaWebView';

export type SyncResult =
  | { ok: true; rows: any[] }
  | { ok: false; error: SyncError };

export function useSincronizador() {
  const [webviewState, setWebviewState] = useState({ active: false, cuit: '', cit: '', rango: { desde: '', hasta: '' } });
  const resolvePromise = useRef<((res: SyncResult) => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // FUNCIÓN Intentar vía Headless 
  const ejecutarSyncHeadless = async (creds: CredencialesArba, rango: RangoFechas): Promise<SyncResult> => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const rows = await sincronizarPorFechaHeadless(creds, rango, signal);
    return { ok: true, rows };
  };

  // FUNCIÓN Intentar vía WebView
  const ejecutarSyncWebView = (creds: CredencialesArba, rango: RangoFechas): Promise<SyncResult> => {
    return new Promise((resolve) => {
      resolvePromise.current = resolve;
      setWebviewState({ active: true, cuit: creds.cuit, cit: creds.cit, rango });
    });
  };

  // FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN
  const sync = useCallback(async (creds: CredencialesArba, rangoInput?: Partial<RangoFechas>): Promise<SyncResult> => {
    const rango = normalizarRango(rangoInput);
    
    try {
      // 1. headless primero, porque es más rápido y menos propenso a fallar por bloqueos de ARBA. Si falla, va al catch y prueba con WebView.
      return await ejecutarSyncHeadless(creds, rango);

    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { ok: false, error: new SyncError('TECNICO', "Sincronización cancelada.") };
      }

      const err = e instanceof SyncError ? e : new SyncError('TECNICO', String(e));
      
      // 2. Si es un error técnico (ARBA nos bloqueó), delegamos al segundo método
      if (err.kind === 'TECNICO') {
        return ejecutarSyncWebView(creds, rango);
      }
      
      return { ok: false, error: err };
    }
  }, []);

  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setWebviewState(prev => ({ ...prev, active: false }));
    if (resolvePromise.current) {
      resolvePromise.current({ ok: false, error: new SyncError('TECNICO', "Sincronización cancelada.") });
      resolvePromise.current = null;
    }
  }, []);

  const onWebviewComplete = useCallback((html: string, error?: string) => {
    setWebviewState(prev => ({ ...prev, active: false }));
    const resolve = resolvePromise.current;
    resolvePromise.current = null;
    
    if (!resolve) return;
    if (error) return resolve({ ok: false, error: new SyncError('TECNICO', error) });

    try {
      const rows = parseTramitesFromPorFechaHtml(html);
      resolve({ ok: true, rows });
    } catch (e) {
      resolve({ ok: false, error: new SyncError('TECNICO', String(e)) });
    }
  }, []);

  const SincronizadorComponent = webviewState.active ? (
    <ArbaWebView cuit={webviewState.cuit} cit={webviewState.cit} rango={webviewState.rango} onSyncComplete={onWebviewComplete} />
  ) : null;

  return { sync, cancelSync, SincronizadorComponent };
}