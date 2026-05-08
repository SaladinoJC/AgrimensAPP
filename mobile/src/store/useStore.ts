import { create } from 'zustand';
import { Novedad } from '../novedades/types';

interface AppState {
  // Autenticación
  cuit: string;
  cit: string;
  isLoggedIn: boolean;
  
  // Sincronización
  isSyncing: boolean;
  syncAbortController: AbortController | null;
  
  // Búsqueda y filtros
  searchQuery: string;
  filterDesde: string;
  filterHasta: string;
  filterPartido: string;
  filterPartida: string;
  
  // Paginación
  currentPage: number;
  pageSize: number;
  
  // Novedades

  
  // Métodos
  setCuit: (cuit: string) => void;
  setCit: (cit: string) => void;
  setIsLoggedIn: (status: boolean) => void;
  setIsSyncing: (status: boolean) => void;
  setSyncAbortController: (controller: AbortController | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterDesde: (date: string) => void;
  setFilterHasta: (date: string) => void;
  setFilterPartido: (partido: string) => void;
  setFilterPartida: (partida: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
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
  syncAbortController: null,
  
  // Búsqueda
  searchQuery: '',
  filterDesde: '',
  filterHasta: '',
  filterPartido: '',
  filterPartida: '',
  
  // Paginación
  currentPage: 1,
  pageSize: 50,
  
  // Novedades
  novedades: [],
  
  // Métodos
  setCuit: (cuit) => set({ cuit }),
  setCit: (cit) => set({ cit }),
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  setIsSyncing: (status) => set({ isSyncing: status }),
  setSyncAbortController: (controller) => set({ syncAbortController: controller }),
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setFilterDesde: (date) => set({ filterDesde: date, currentPage: 1 }),
  setFilterHasta: (date) => set({ filterHasta: date, currentPage: 1 }),
  setFilterPartido: (partido) => set({ filterPartido: partido, currentPage: 1 }),
  setFilterPartida: (partida) => set({ filterPartida: partida, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  setNovedades: (novedades) => set({ novedades }),
  clearNovedades: () => set({ novedades: [] }),
  clearFilters: () => set({
    searchQuery: '',
    filterDesde: '',
    filterHasta: '',
    filterPartido: '',
    filterPartida: '',
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
    currentPage: 1,
    novedades: [],
  }),
}));
