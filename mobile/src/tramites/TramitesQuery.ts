import { getStats, getTramites } from '../db/database';

export type TramitesFilters = {
  search?: string;
  desde?: string;
  hasta?: string;
  partido?: string;
  partida?: string;
  limit?: number;
  offset?: number;
};

export const TramitesQuery = {
  async list(filters: TramitesFilters = {}) {
    const {
      search = '',
      desde = '',
      hasta = '',
      partido = '',
      partida = '',
      limit = 50,
      offset = 0,
    } = filters;

    return getTramites(search, desde, hasta, partido, partida, limit, offset);
  },

  async dashboard() {
    return getStats();
  },
};
