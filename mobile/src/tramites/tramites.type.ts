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

export const ESTADOS_OPC = [
  { label: "Todos los estados", value: "" },
  { label: "Finalizado", value: "FINALIZADO" },
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "En Curso", value: "EN CURSO" },
  { label: "Rechazado", value: "RECHAZADO" },
];

export const TIPOS_OPC = [
  { label: "Todos los tipos", value: "" }, // Mantenemos la opción por defecto para limpiar el filtro
  { label: "Antecedentes", value: "Antecedentes" },
  {
    label: "Aprobacion Plano de Usucapión GEO",
    value: "Aprobacion Plano de Usucapión GEO",
  },
  {
    label: "Constitución de Estado Parcelario",
    value: "Constitución de Estado Parcelario",
  },
  {
    label: "Proyecto Plano de Mensura GEO",
    value: "Proyecto Plano de Mensura GEO",
  },
  { label: "Subsistencia", value: "Subsistencia" },
];
