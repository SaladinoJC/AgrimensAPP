const C_GREEN = "#66bb6a";
const C_AMBER = "#ffca28";
const C_RED = "#ef5350";
const C_GREY = "#78909c";
const C_ACCENT = "#4fc3f7";


export const getTramiteStatusColor = (estado?: string) => {
  if (!estado) return "#90a4ae"; // Gris azulado por defecto

  const e = estado.toUpperCase();

  // 1. Estados de Error / Rechazo / Problemas (Rojo)
  if (e.includes("RECHAZ") || e.includes("DEVUELTO SIN DISPONIBILIDAD")) {
    return "#ef5350"; 
  }

  // 2. Estados de Éxito / Finalización (Verde esmeralda)
  if (e.includes("FINALIZ") || e.includes("ENTREGADO")) {
    return "#10b981"; 
  }

  // 3. Estados en Proceso / Pendientes / Observados (Ámbar/Naranja)
  if (
    e.includes("CURSO") || 
    e.includes("TRAMITE") || 
    e.includes("PENDIENTE") || 
    e.includes("OBSERVADO")
  ) {
    return "#f59e0b"; 
  }

  // Fallback si ARBA inventa un estado nuevo
  return "#90a4ae";
};

export const getStatusColor = getTramiteStatusColor;
export const getColor = getTramiteStatusColor;