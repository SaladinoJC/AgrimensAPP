import { create } from "zustand";
import { Novedad } from "@/novedades/types";
import {
  CredencialesArba,
  defaultFiltros,
  defaultPaginacion,
  FiltrosBusqueda,
  Paginacion,
  RangoFechas,
} from "@/store/store.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppState {
  // Autenticación
  credenciales: CredencialesArba;
  // Búsqueda y filtros
  filtros: FiltrosBusqueda;
  // Paginación
  paginacion: Paginacion;
  // Novedades
  novedades: Novedad[];
  isLoggedIn: boolean;
  // Sincronización
  isSyncing: boolean;
  refreshKey: number;

  //theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Métodos
  setCredenciales: (credenciales: CredencialesArba) => void;
  setIsLoggedIn: (status: boolean) => void;
  setIsSyncing: (status: boolean) => void;

  // Tipado estricto: Omitimos 'fecha' del setFiltro general
  setFiltro: (key: keyof Omit<FiltrosBusqueda, "fecha">, value: string) => void;

  // Tipado estricto: Usamos las llaves de RangoFechas ('desde' | 'hasta')
  setFiltroFecha: (key: keyof RangoFechas, value: string) => void;

  clearFiltros: () => void;
  setPaginacion: (key: keyof Paginacion, value: number) => void;

  setNovedades: (novedades: Novedad[]) => void;
  clearNovedades: () => void;
  setRefreshKey: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  credenciales: { cuit: "", cit: "" },
  isLoggedIn: false,
  isSyncing: false,

  filtros: defaultFiltros,
  paginacion: defaultPaginacion,
  novedades: [],
  refreshKey: 0,

  setCredenciales: (credenciales) => set({ credenciales }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),

  setFiltro: (key, value) =>
    set((state) => ({
      filtros: { ...state.filtros, [key]: value },
      paginacion: { ...state.paginacion, page: 1 },
    })),

  // Implementación del setter anidado de fechas
  setFiltroFecha: (key, value) =>
    set((state) => ({
      filtros: {
        ...state.filtros,
        fecha: {
          ...state.filtros.fecha,
          [key]: value,
        },
      },
      paginacion: { ...state.paginacion, page: 1 },
    })),

  clearFiltros: () =>
    set((state) => ({
      filtros: defaultFiltros,
      paginacion: { ...state.paginacion, page: 1 },
    })),

  setPaginacion: (key, value) =>
    set((state) => ({
      paginacion: { ...state.paginacion, [key]: value },
    })),

  setNovedades: (novedades) => set({ novedades }),
  clearNovedades: () => set({ novedades: [] }),
  setRefreshKey: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

  theme: "dark", // o el default que tengas

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    set({ theme: newTheme });
    AsyncStorage.setItem("app_theme", newTheme).catch(console.error);
  },

  setTheme: (theme: "light" | "dark") => set({ theme }),

  logout: () =>
    set({
      credenciales: { cuit: "", cit: "" },
      isLoggedIn: false,
      filtros: defaultFiltros,
      paginacion: defaultPaginacion,
      novedades: [],
      refreshKey: 0,
    }),
}));
