import { create } from 'zustand';

interface AppState {
  cuit: string;
  cit: string;
  isSyncing: boolean;
  setCuit: (cuit: string) => void;
  setCit: (cit: string) => void;
  setIsSyncing: (status: boolean) => void;
  
  // Novedades (Alertas de cambios de estado)
  novedades: Array<{nro: string, viejo: string, nuevo: string}>;
  setNovedades: (novedades: Array<{nro: string, viejo: string, nuevo: string}>) => void;
  clearNovedades: () => void;
}

export const useStore = create<AppState>((set) => ({
  cuit: '',
  cit: '',
  isSyncing: false,
  setCuit: (cuit) => set({ cuit }),
  setCit: (cit) => set({ cit }),
  setIsSyncing: (status) => set({ isSyncing: status }),
  
  novedades: [],
  setNovedades: (novedades) => set({ novedades }),
  clearNovedades: () => set({ novedades: [] }),
}));
