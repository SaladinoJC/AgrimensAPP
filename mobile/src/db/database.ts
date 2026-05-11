import * as SQLite from 'expo-sqlite';
import { Novedad } from '../novedades/types';
import { Tramite, TramiteDetail } from '../types/tramites-type';

let db: SQLite.SQLiteDatabase | null = null;

//Singleton para obtener la instancia de la base de datos. Asegura que solo se abra una conexión.
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db !== null) {
    return db;
  }
  db = await SQLite.openDatabaseAsync('tramites.db');
  return db;
};

export const initDB = async () => {
  const db = await getDatabase();
  
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

    CREATE TABLE IF NOT EXISTS notificaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nroExpediente TEXT,
        viejo_estado TEXT,
        nuevo_estado TEXT,
        fecha TEXT,
        leida INTEGER DEFAULT 0
    );
  `);
};

export const upsertTramites = async (rows: any[]) => {
  const db = await getDatabase();
  
  const novedades: Novedad[] = [];
  const stmt = await db.prepareAsync(`
    INSERT OR REPLACE INTO tramites
    (nroExpediente, partido, partida, estado, fecha_movimiento,
     ultima_sincronizacion, tipo_tramite, nomenclatura, origen,
     fecha_alta, oblea, demora, final_estimada)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    // Preleer estados existentes en batch (evita N+1)
    const nros = Array.from(
      new Set(
        rows
          .map((r) => String(r.numeroTramite || r.nroExpediente || '').trim())
          .filter((nro) => nro.length > 0)
      )
    );

    const estadoPrevio = new Map<string, string>();
    const CHUNK = 500;
    for (let i = 0; i < nros.length; i += CHUNK) {
      const chunk = nros.slice(i, i + CHUNK);
      const placeholders = chunk.map(() => '?').join(',');
      const q = `SELECT nroExpediente, estado FROM tramites WHERE nroExpediente IN (${placeholders})`;
      const rowsPrev = await db.getAllAsync<{ nroExpediente: string; estado: string }>(q, chunk);
      for (const r of rowsPrev) {
        if (r?.nroExpediente) estadoPrevio.set(String(r.nroExpediente), String(r.estado ?? ''));
      }
    }

    await db.execAsync('BEGIN TRANSACTION');
    for (const r of rows) {
      const nro = String(r.numeroTramite || r.nroExpediente || "").trim();
      if (!nro) continue;
      const estado_nuevo = String(r.estado || "");
      
      // Check for novedades
      const viejoEstado = estadoPrevio.get(nro);
      if (viejoEstado && viejoEstado.toUpperCase() !== estado_nuevo.toUpperCase()) {
        novedades.push({ nro, viejo: viejoEstado, nuevo: estado_nuevo });
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

    if (novedades.length > 0) {
      const stmtNotif = await db.prepareAsync(`
        INSERT INTO notificaciones (nroExpediente, viejo_estado, nuevo_estado, fecha) 
        VALUES (?, ?, ?, ?)
      `);
      const fechaNow = new Date().toISOString();
      for (const nov of novedades) {
        await stmtNotif.executeAsync([nov.nro, nov.viejo, nov.nuevo, fechaNow]);
      }
      await stmtNotif.finalizeAsync();
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
  estado: string = "",
  limit: number = 50, 
  offset: number = 0
) => {
  const db = await getDatabase();

  if (!db) return [];
  
  let q = "SELECT * FROM tramites WHERE 1=1";
  const params: any[] = [];
  
  if (desde) { q += " AND fecha_alta >= ?"; params.push(desde); }
  if (hasta) { q += " AND fecha_alta <= ?"; params.push(hasta); }
  if (partido) { q += " AND partido = ?"; params.push(partido); }
  if (partida) { q += " AND partida LIKE ?"; params.push(`%${partida}%`); }
  if (estado) { q += " AND UPPER(estado) LIKE ?"; params.push(`%${estado.toUpperCase()}%`); }
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
  const db = await getDatabase();
  
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
  partida: string = "",
  estado: string = ""
): Promise<number> => {
  const db = await getDatabase();
  if (!db) return 0;
  
  let q = "SELECT COUNT(*) as count FROM tramites WHERE 1=1";
  const params: any[] = [];
  
  if (desde) { q += " AND fecha_alta >= ?"; params.push(desde); }
  if (hasta) { q += " AND fecha_alta <= ?"; params.push(hasta); }
  if (partido) { q += " AND partido = ?"; params.push(partido); }
  if (partida) { q += " AND partida LIKE ?"; params.push(`%${partida}%`); }
  if (estado) { q += " AND UPPER(estado) LIKE ?"; params.push(`%${estado.toUpperCase()}%`); }
  if (search) {
    const s = `%${search}%`;
    q += " AND (nroExpediente LIKE ? OR partido LIKE ? OR partida LIKE ? OR nomenclatura LIKE ? OR tipo_tramite LIKE ? OR estado LIKE ? OR oblea LIKE ?)";
    params.push(s, s, s, s, s, s, s);
  }
  
  const result = await db.getFirstAsync<{count: number}>(q, params);
  return result?.count || 0;
};

export const clearDatabase = async () => {
  try {
    const db = await getDatabase();
    await db.execAsync(`DELETE FROM tramites;`);
    console.log("Base de datos local limpiada correctamente tras el cierre de sesión.");
  } catch (error) {
    console.error("Error al limpiar la base de datos:", error);
    throw error;
  }
};

export const getNotificaciones = async () => {
  const dbSegura = await getDatabase();
  return await dbSegura.getAllAsync(`SELECT * FROM notificaciones ORDER BY fecha DESC`);
};

export const clearNotificaciones = async () => {
  const dbSegura = await getDatabase();
  await dbSegura.execAsync(`DELETE FROM notificaciones;`);
};

export const getTramiteByNro = async (nroExpediente: string) => {
  const dbSegura = await getDatabase();
  return await dbSegura.getFirstAsync(`SELECT * FROM tramites WHERE nroExpediente = ?`, [nroExpediente]) as TramiteDetail;
};