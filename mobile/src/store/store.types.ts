export type RangoFechas = {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
};

export type CredencialesArba = {
  cuit: string;
  cit: string;
};

export type FiltrosBusqueda = {
  query: string;
  fecha: RangoFechas;
  partido: string;
  partida: string;
  estado: string;
  tipo_tramite: string;
};

export type Paginacion = {
  page: number;
  size: number;
};

export const defaultFiltros: FiltrosBusqueda = {
  query: "",
  fecha: { desde: "", hasta: "" },
  partido: "",
  partida: "",
  estado: "",
  tipo_tramite: "",
};

export const defaultPaginacion: Paginacion = {
  page: 1,
  size: 50,
};
