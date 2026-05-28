const C_GREEN = "#66bb6a";
const C_AMBER = "#ffca28";
const C_RED = "#ef5350";
const C_GREY = "#78909c";
const C_ACCENT = "#4fc3f7";


export const getStatusColor = (status?: string) => {
    if (!status) return C_GREY;
    const upper = status.toUpperCase();
    if (upper.includes('FINALIZADO') || upper.includes('ENTREGADO')) return C_GREEN;
    if (upper.includes('RECHAZADO')) return C_RED;
    if (upper.includes('OBSERVADO') || upper.includes('PENDIENTE') || upper.includes('CURSO')) return C_AMBER;
    return C_ACCENT;
  };

export const getColor = (estado?: string) => {
    if (!estado) return C_GREY;
    const e = estado.toUpperCase();
    if (e.includes("RECHAZ")) return C_RED;
    if (e.includes("FINALIZ") || e.includes("ENTREGADO")) return C_GREEN;
    if (e.includes("EN CURSO") || e.includes("EN TRAMITE") || e.includes("PENDIENTE") || e.includes("OBSERVADO")) return C_AMBER;
    return C_GREY;
  };