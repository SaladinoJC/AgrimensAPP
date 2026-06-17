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
  oblea: string;
  partido: string;
  partida: string;
  fecha_movimiento?: string;
  estado?: string;
}

export const ESTADOS_OPC = [
  { label: "Todos los estados", value: "" },
  { label: "DEVUELTO SIN DISPONIBILIDAD DE DOC.", value: "DEVUELTO SIN DISPONIBILIDAD DE DOC." },
  { label: "EN CURSO", value: "EN CURSO" },
  { label: "ENTREGADO DEVUELTO", value: "ENTREGADO DEVUELTO" },
  { label: "ENTREGADO FINALIZADO", value: "ENTREGADO FINALIZADO" },
  { label: "FINALIZADO", value: "FINALIZADO" },
  { label: "FINALIZADO SIN ENTREGA DE DOC", value: "FINALIZADO SIN ENTREGA DE DOC" },
  { label: "PENDIENTE DE RECEPCION EN ZONA", value: "PENDIENTE DE RECEPCION EN ZONA" },
  { label: "INICIADO EN", value: "INICIADO EN" },
  { label: "RECHAZADO", value: "RECHAZADO" },
];

export const TIPOS_OPC = [
  { label: "Todos los tipos", value: "" },
  { label: "Anexo II", value: "Anexo II" },
  { label: "Antecedentes", value: "Antecedentes" },
  { label: "Aprobacion Plano de Usucapión GEO", value: "Aprobacion Plano de Usucapión GEO" },
  { label: "Artículo 8°", value: "Artículo 8°" },
  { label: "CEP", value: "CEP" },
  { label: "CEP Reunion", value: "CEP Reunion" },
  { label: "CEP según Circular 3/2011", value: "CEP según Circular 3/2011" },
  { label: "Circular 10", value: "Circular 10" },
  { label: "Constitución de Estado Parcelario", value: "Constitución de Estado Parcelario" },
  { label: "Declaracion Jurada", value: "Declaracion Jurada" },
  { label: "GEO - Aprobación Plano de Mensura", value: "GEO - Aprobación Plano de Mensura" },
  { label: "GEO - Corrección Plano de Mensura (Sin registrar)", value: "GEO - Corrección Plano de Mensura (Sin registrar)" },
  { label: "GEO - Georreferenciación", value: "GEO - Georreferenciación" },
  { label: "GEO - Proyecto Plano de Mensura", value: "GEO - Proyecto Plano de Mensura" },
  { label: "Legajo Parcelario (Registración de planos)", value: "Legajo Parcelario (Registración de planos)" },
  { label: "PH - Aprobación de Planos (Nuevo-CbioProy-Ratif)", value: "PH - Aprobación de Planos (Nuevo-CbioProy-Ratif)" },
  { label: "PH - Circular 10", value: "PH - Circular 10" },
  { label: "PH - Constitución de Edo Parcelario", value: "PH - Constitución de Edo Parcelario" },
  { label: "PH - Corrección de Planos PH", value: "PH - Corrección de Planos PH" },
  { label: "PH - Decreto 947", value: "PH - Decreto 947" },
  { label: "PH - Legajo Parcelario (Registración de planos)", value: "PH - Legajo Parcelario (Registración de planos)" },
  { label: "PH - Posesión", value: "PH - Posesión" },
  { label: "PH - Visación Previa (Nuevo-CbioProy-Ratif)", value: "PH - Visación Previa (Nuevo-CbioProy-Ratif)" },
  { label: "Presentación DD.JJ.", value: "Presentación DD.JJ." },
  { label: "Proyecto Plano de Mensura GEO", value: "Proyecto Plano de Mensura GEO" },
  { label: "Reclamo por Inconsistencia", value: "Reclamo por Inconsistencia" },
  { label: "Solicitud Valor Tierra Urbana", value: "Solicitud Valor Tierra Urbana" },
  { label: "Solicitud de Cedula", value: "Solicitud de Cedula" },
  { label: "Solicitud de DDJJ", value: "Solicitud de DDJJ" },
  { label: "Solicitud de Plano", value: "Solicitud de Plano" },
  { label: "Solicitud de Valuación Fiscal", value: "Solicitud de Valuación Fiscal" },
  { label: "Subsistencia", value: "Subsistencia" },
  { label: "Visación Previa PH", value: "Visación Previa PH" },
];

