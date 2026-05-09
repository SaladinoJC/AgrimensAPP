import React, { useState, useCallback, useRef } from 'react';
import { sincronizarPorFechaHeadless } from './headlessAdapter'; // Asumo que tienes esto creado
import { CredencialesArba, RangoFechas, SyncError } from './types';
import { parseTramitesFromPorFechaHtml } from './parserDsisic';
import { normalizarRango } from './sincronizacion';
import { ArbaWebView } from './../services/ArbaWebView';
import { useStore } from '../store/useStore';

export type SyncResult =
  | { ok: true; rows: any[] }
  | { ok: false; error: SyncError };

export function useSincronizador() {
  // Estado interno: Solo a este hook le importa si el WebView está activo o no
  const [webviewState, setWebviewState] = useState({ 
    active: false, 
    cuit: '', 
    cit: '', 
    rango: { desde: '', hasta: '' } 
  });
  const {setIsSyncing} = useStore();
  const resolvePromise = useRef<((res: SyncResult) => void) | null>(null);

  const sync = useCallback(async (creds: CredencialesArba, rangoInput?: Partial<RangoFechas>): Promise<SyncResult> => {
    const rango = normalizarRango(rangoInput);
    
    try {
      // 1. Intentar la vía rápida e invisible primero
      const rows = await sincronizarPorFechaHeadless(creds, rango);
      return { ok: true, rows };
    } catch (e: any) {
      console.log("Fallo sincronizacion invisible (headless): ");
      const err = e instanceof SyncError ? e : new SyncError('TECNICO', String(e));
      
      // 2. Si ARBA nos bloqueó o pide sesión gráfica, levantamos el "Caballo de Troya"
      if (err.kind === 'TECNICO') {
        return new Promise((resolve) => {
          resolvePromise.current = resolve;
          // Al cambiar este estado, React renderiza el SincronizadorComponent abajo
          setWebviewState({ active: true, cuit: creds.cuit, cit: creds.cit, rango });
        });
      }
      
      return { ok: false, error: err };
    }
  }, []);

  // Función para cuando el usuario presiona la (X) roja
  const cancelSync = useCallback(() => {
    setWebviewState(prev => ({ ...prev, active: false }));
    setIsSyncing(false);
    if (resolvePromise.current) {
      resolvePromise.current({ ok: false, error: new SyncError('TECNICO', "Sincronización cancelada por el usuario.") });
      resolvePromise.current = null;
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

  // El componente que App.tsx va a renderizar sin saber qué hay adentro
  const SincronizadorComponent = webviewState.active ? (
    <ArbaWebView 
      cuit={webviewState.cuit} 
      cit={webviewState.cit} 
      rango={webviewState.rango} 
      onSyncComplete={onWebviewComplete} 
    />
  ) : null;

  return { sync, cancelSync, SincronizadorComponent };
}