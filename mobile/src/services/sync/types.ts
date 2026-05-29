export type SyncErrorKind = 'CREDENCIALES_INVALIDAS' | 'ARBA_NO_DISPONIBLE' | 'TECNICO';

export class SyncError extends Error {
  kind: SyncErrorKind;

  constructor(kind: SyncErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface ArchivoArba {
  numeroTramite: number;
  secuencia: number;
  tipo: number;
  extension: string;
  descripcion: string;
  carpeta: string;
}
