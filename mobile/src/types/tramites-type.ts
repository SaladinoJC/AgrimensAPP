export interface TramiteDetail {
  nroExpediente: string;
  estado?: string;
  partido?: string;
  partida?: string;
  tipo_tramite?: string;
  nomenclatura?: string;
  fecha_alta?: string;
  fecha_movimiento?: string;
  origen?: string;
  oblea?: string;
  demora?: string;
  final_estimada?: string;
  ultima_sincronizacion?: string;
}

export interface Tramite {
  nroExpediente: string;
  tipo_tramite: string;
  partido: string;
  partida: string;
  fecha_movimiento?: string;
  estado?: string;
}