import * as LocalAuthentication from 'expo-local-authentication';

export type AuthLocalResult =
  | { ok: true }
  | { ok: false; message: string };

export async function autenticarAccesoLocal(): Promise<AuthLocalResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acceso seguro a AgrimensAPP',
      fallbackLabel: 'Usar PIN',
      // Importante: permitir fallback del dispositivo (PIN/patrón/passcode).
      disableDeviceFallback: false,
    });

    if (result.success) return { ok: true };

    // Cancel / fail: mensaje corto, sin filtrar info sensible.
    return { ok: false, message: 'Autenticación cancelada o fallida.' };
  } catch {
    return { ok: false, message: 'No se pudo iniciar autenticación local.' };
  }
}

