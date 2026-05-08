import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('tramites.db');
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tramites (
        nroExpediente TEXT PRIMARY KEY,
        partido TEXT, 
        partida TEXT, 
        estado TEXT,
        fecha_movimiento TEXT, 
        ultima_sincronizacion TEXT,
        tipo_tramite TEXT, 
        nomenclatura TEXT, 
        origen TEXT,
        fecha_alta TEXT, 
        oblea TEXT, 
        demora TEXT, 
        final_estimada TEXT
    );
  `);
};

export const upsertTramites = async (rows: any[]) => {
  if (!db) return [];
  
  const novedades: Array<{nro: string, viejo: string, nuevo: string}> = [];
  const stmt = await db.prepareAsync(`
    INSERT OR REPLACE INTO tramites
    (nroExpediente, partido, partida, estado, fecha_movimiento,
     ultima_sincronizacion, tipo_tramite, nomenclatura, origen,
     fecha_alta, oblea, demora, final_estimada)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    await db.execAsync('BEGIN TRANSACTION');
    for (const r of rows) {
      const nro = String(r.numeroTramite || r.nroExpediente || "");
      const estado_nuevo = String(r.estado || "");
      
      // Check for novedades
      const viejo = await db.getFirstAsync<{estado: string}>('SELECT estado FROM tramites WHERE nroExpediente = ?', [nro]);
      if (viejo && viejo.estado && viejo.estado.toUpperCase() !== estado_nuevo.toUpperCase()) {
        novedades.push({ nro, viejo: viejo.estado, nuevo: estado_nuevo });
      }

      const fecha_estado = String(r.fechaEstado || r.fecha_movimiento || "");
      const fecha_alta = String(r.fechaAlta || r.fecha_alta || "");
      const tipo = String(r.tramite || r.tipo_tramite || "");
      const nomenclatura = String(r.nomenclatura || "").trim();
      const origen = String(r.origen || "");
      const oblea = String(r.oblea || "");
      const demora = String(r.demora || "");
      const final_est = String(r.finalEstimada || "");
      const ultima_sinc = new Date().toISOString().replace('T', ' ').substring(0, 19);

      await stmt.executeAsync([
        nro, 
        String(r.partido || ""), 
        String(r.partida || ""), 
        estado_nuevo, 
        fecha_estado,
        ultima_sinc, 
        tipo, 
        nomenclatura, 
        origen, 
        fecha_alta, 
        oblea, 
        demora, 
        final_est
      ]);
    }
    await db.execAsync('COMMIT');
  } catch(e) {
    await db.execAsync('ROLLBACK');
    throw e;
  } finally {
    await stmt.finalizeAsync();
  }
  
  return novedades;
};

export const getTramites = async (
  search: string = "", 
  desde: string = "", 
  hasta: string = "", 
  partido: string = "", 
  partida: string = "", 
  limit: number = 50, 
  offset: number = 0
) => {
  if (!db) return [];
  
  let q = "SELECT * FROM tramites WHERE 1=1";
  const params: any[] = [];
  
  if (desde) { q += " AND fecha_alta >= ?"; params.push(desde); }
  if (hasta) { q += " AND fecha_alta <= ?"; params.push(hasta); }
  if (partido) { q += " AND partido = ?"; params.push(partido); }
  if (partida) { q += " AND partida LIKE ?"; params.push(`%${partida}%`); }

  if (search) {
    const s = `%${search}%`;
    q += " AND (nroExpediente LIKE ? OR partido LIKE ? OR partida LIKE ? OR nomenclatura LIKE ? OR tipo_tramite LIKE ? OR estado LIKE ? OR oblea LIKE ?)";
    params.push(s, s, s, s, s, s, s);
  }
  
  q += " ORDER BY fecha_alta DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  return await db.getAllAsync(q, params);
};

export const getStats = async () => {
  if (!db) return { total: 0, en_curso: 0, finalizados: 0, rechazados: 0 };
  
  const total = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM tramites');
  const finalizados = await db.getFirstAsync<{count: number}>("SELECT COUNT(*) as count FROM tramites WHERE UPPER(estado) LIKE '%FINALIZADO%' OR UPPER(estado) LIKE '%ENTREGADO%'");
  const rechazados = await db.getFirstAsync<{count: number}>("SELECT COUNT(*) as count FROM tramites WHERE UPPER(estado) LIKE '%RECHAZADO%'");
  const en_curso = await db.getFirstAsync<{count: number}>("SELECT COUNT(*) as count FROM tramites WHERE UPPER(estado) LIKE '%EN CURSO%' OR UPPER(estado) LIKE '%EN TRAMITE%' OR UPPER(estado) LIKE '%PENDIENTE%'");
  
  return {
    total: total?.count || 0,
    en_curso: en_curso?.count || 0,
    finalizados: finalizados?.count || 0,
    rechazados: rechazados?.count || 0,
  };
};

export const getTotalCount = async (
  search: string = "", 
  desde: string = "", 
  hasta: string = "", 
  partido: string = "", 
  partida: string = ""
): Promise<number> => {
  if (!db) return 0;
  
  let q = "SELECT COUNT(*) as count FROM tramites WHERE 1=1";
  const params: any[] = [];
  
  if (desde) { q += " AND fecha_alta >= ?"; params.push(desde); }
  if (hasta) { q += " AND fecha_alta <= ?"; params.push(hasta); }
  if (partido) { q += " AND partido = ?"; params.push(partido); }
  if (partida) { q += " AND partida LIKE ?"; params.push(`%${partida}%`); }

  if (search) {
    const s = `%${search}%`;
    q += " AND (nroExpediente LIKE ? OR partido LIKE ? OR partida LIKE ? OR nomenclatura LIKE ? OR tipo_tramite LIKE ? OR estado LIKE ? OR oblea LIKE ?)";
    params.push(s, s, s, s, s, s, s);
  }
  
  const result = await db.getFirstAsync<{count: number}>(q, params);
  return result?.count || 0;
};
