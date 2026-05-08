export type SyncErrorKind = 'CREDENCIALES_INVALIDAS' | 'ARBA_NO_DISPONIBLE' | 'TECNICO';

export class SyncError extends Error {
  kind: SyncErrorKind;

  constructor(kind: SyncErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export type RangoFechas = {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
};

export type CredencialesArba = {
  cuit: string;
  cit: string;
};

