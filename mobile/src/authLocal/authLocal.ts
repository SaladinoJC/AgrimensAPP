import * as LocalAuthentication from 'expo-local-authentication';

export type AuthLocalResult =
  | { ok: true }
  | { ok: false; message: string };

export async function autenticarAccesoLocal(): Promise<AuthLocalResult> {
  try {
    const [hasHardware, isEnrolled, enrolledLevel] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);

    const hasDeviceCredential = enrolledLevel === LocalAuthentication.SecurityLevel.SECRET;
    const requiresFallbackOnly = !hasHardware || !isEnrolled;

    if (requiresFallbackOnly && !hasDeviceCredential) {
      return {
        ok: false,
        message: 'No hay biometría ni PIN/passcode del dispositivo configurado. Configurá un bloqueo de pantalla para continuar.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: requiresFallbackOnly
        ? 'Validá con PIN/passcode del dispositivo'
        : 'Acceso seguro a AgrimensAPP',
      fallbackLabel: 'Usar PIN',
      // Forzar fallback del dispositivo (PIN/patrón/passcode) cuando biometría no aplica.
      disableDeviceFallback: false,
    });

    if (result.success) return { ok: true };

    if (
      requiresFallbackOnly &&
      (result.error === 'not_enrolled' || result.error === 'not_available' || result.error === 'passcode_not_set')
    ) {
      return {
        ok: false,
        message: 'No se pudo validar con PIN/passcode. Configurá bloqueo de pantalla para habilitar acceso.',
      };
    }

    // Cancel/fail: mensaje corto, sin filtrar info sensible.
    return { ok: false, message: 'Autenticación cancelada o fallida.' };
  } catch {
    return { ok: false, message: 'No se pudo iniciar autenticación local.' };
  }
}

