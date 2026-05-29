import React, { useState, useCallback, useRef } from "react";
import { sincronizarPorFechaHeadless } from "@/services/sync/headlessAdapter";
import { SyncError } from "@/services/sync/types";
import { parseTramitesFromPorFechaHtml } from "@/services/sync/parserDsisic";
import { normalizarRango } from "@/services/sync/sincronizacion";
import { ArbaWebView } from "@/components/arba/ArbaWebView";
import { CredencialesArba, RangoFechas } from "@/store/store.types";

export type SyncResult =
  | { ok: true; rows: any[] }
  | { ok: false; error: SyncError };

export function useSincronizador() {
  const [webviewState, setWebviewState] = useState({
    active: false,
    cuit: "",
    cit: "",
    rango: { desde: "", hasta: "" },
  });
  const resolvePromise = useRef<((res: SyncResult) => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // FUNCIÓN Intentar vía Headless. Memorizamos para no crearla en cada sync
  const ejecutarSyncHeadless = useCallback(
    async (
      creds: CredencialesArba,
      rango: RangoFechas,
    ): Promise<SyncResult> => {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const rows = await sincronizarPorFechaHeadless(creds, rango, signal);
      return { ok: true, rows };
    },
    [],
  );

  // FUNCIÓN Intentar vía WebView
  const ejecutarSyncWebView = useCallback(
    (creds: CredencialesArba, rango: RangoFechas): Promise<SyncResult> => {
      return new Promise((resolve) => {
        resolvePromise.current = resolve;
        setWebviewState({
          active: true,
          cuit: creds.cuit,
          cit: creds.cit,
          rango,
        });
      });
    },
    [],
  );

  // FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN
  const sync = useCallback(
    async (
      creds: CredencialesArba,
      rangoInput?: Partial<RangoFechas>,
    ): Promise<SyncResult> => {
      const rango = normalizarRango(rangoInput);

      try {
        return await ejecutarSyncHeadless(creds, rango);
      } catch (e: unknown) {
        // Verificamos si es un error de aborto nativo del DOM
        if (e instanceof Error && e.name === "AbortError") {
          return {
            ok: false,
            error: new SyncError("TECNICO", "Sincronización cancelada."),
          };
        }
        const err =
          e instanceof SyncError ? e : new SyncError("TECNICO", String(e));

        if (err.kind === "TECNICO") {
          return ejecutarSyncWebView(creds, rango);
        }

        return { ok: false, error: err };
      }
    },
    [ejecutarSyncHeadless, ejecutarSyncWebView],
  );

  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setWebviewState((prev) => ({ ...prev, active: false }));

    if (resolvePromise.current) {
      resolvePromise.current({
        ok: false,
        error: new SyncError("TECNICO", "Sincronización cancelada."),
      });
      resolvePromise.current = null;
    }
  }, []);

  const onWebviewComplete = useCallback((html: string, error?: string) => {
    setWebviewState((prev) => ({ ...prev, active: false }));

    const resolve = resolvePromise.current;
    resolvePromise.current = null; // Limpiamos la referencia para evitar memory leaks

    if (!resolve) return;
    if (error)
      return resolve({ ok: false, error: new SyncError("TECNICO", error) });

    try {
      const rows = parseTramitesFromPorFechaHtml(html);
      resolve({ ok: true, rows });
    } catch (e) {
      resolve({ ok: false, error: new SyncError("TECNICO", String(e)) });
    }
  }, []);

  const sincronizadorElement = webviewState.active ? (
    <ArbaWebView
      cuit={webviewState.cuit}
      cit={webviewState.cit}
      rango={webviewState.rango}
      onSyncComplete={onWebviewComplete}
    />
  ) : null;

  return { sync, cancelSync, sincronizadorElement };
}
