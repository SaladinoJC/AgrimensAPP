import { Novedad } from '@/novedades/types';

export function tieneNovedades(novedades: Novedad[]): boolean {
  return Array.isArray(novedades) && novedades.length > 0;
}

export function textoNotificacionAgregada(novedades: Novedad[]): { title: string; body: string } {
  const n = novedades.length;
  return {
    title: '¡Novedades en ARBA!',
    body: `Se actualizaron los estados de ${n} trámite(s).`,
  };
}

