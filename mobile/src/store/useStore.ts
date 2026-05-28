import { create } from 'zustand';
import { Novedad } from '@/novedades/types';

interface AppState {
  // Autenticación
  cuit: string;
  cit: string;
  isLoggedIn: boolean;
  
  // Sincronización
  isSyncing: boolean;
  
  // Búsqueda y filtros
  searchQuery: string;
  filterDesde: string;
  filterHasta: string;
  filterPartido: string;
  filterPartida: string;
  filterEstado: string;
  
  // Paginación
  currentPage: number;
  pageSize: number;
  
  // Novedades

  refreshKey: number; // Para forzar recarga de lista de trámites después de sincronizar
  
  // Métodos
  setCuit: (cuit: string) => void;
  setCit: (cit: string) => void;
  setIsLoggedIn: (status: boolean) => void;
  setIsSyncing: (status: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterDesde: (date: string) => void;
  setFilterHasta: (date: string) => void;
  setFilterPartido: (partido: string) => void;
  setFilterPartida: (partida: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilterEstado: (estado: string) => void;
  setRefreshKey: () => void;
  
  // Novedades (Alertas de cambios de estado)
  novedades: Novedad[];
  setNovedades: (novedades: Novedad[]) => void;
  clearNovedades: () => void;
  clearFilters: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Autenticación
  cuit: '',
  cit: '',
  isLoggedIn: false,
  
  // Sincronización
  isSyncing: false,
  
  // Búsqueda
  searchQuery: '',
  filterDesde: '',
  filterHasta: '',
  filterPartido: '',
  filterPartida: '',
  filterEstado: '',
  // Paginación
  currentPage: 1,
  pageSize: 50,
  
  // Novedades
  novedades: [],
  //reflesh lista de tramites al sincronizar

  refreshKey: 0,
  
  // Métodos
  setCuit: (cuit) => set({ cuit }),
  setCit: (cit) => set({ cit }),
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  setIsSyncing: (status) => set({ isSyncing: status }),
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setFilterDesde: (date) => set({ filterDesde: date, currentPage: 1 }),
  setFilterHasta: (date) => set({ filterHasta: date, currentPage: 1 }),
  setFilterPartido: (partido) => set({ filterPartido: partido, currentPage: 1 }),
  setFilterPartida: (partida) => set({ filterPartida: partida, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  setFilterEstado: (estado) => set({ filterEstado: estado, currentPage: 1 }),
  setNovedades: (novedades) => set({ novedades }),
  clearNovedades: () => set({ novedades: [] }),
  setRefreshKey: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
  clearFilters: () => set({
    searchQuery: '',
    filterDesde: '',
    filterHasta: '',
    filterPartido: '',
    filterPartida: '',
    filterEstado: '',
    currentPage: 1,
  }),
  logout: () => set({
    cuit: '',
    cit: '',
    isLoggedIn: false,
    searchQuery: '',
    filterDesde: '',
    filterHasta: '',
    filterPartido: '',
    filterPartida: '',
    filterEstado: '',
    currentPage: 1,
    novedades: [],
    refreshKey: 0,
  }),
}));
