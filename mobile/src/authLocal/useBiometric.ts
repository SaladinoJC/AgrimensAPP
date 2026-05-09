import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useCallback } from 'react';

interface BiometricCheckResult {
  available: boolean;
  biometryType: LocalAuthentication.AuthenticationType | null;
  isDeviceSecure: boolean;
}

interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export const useBiometric = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkBiometricAvailability = useCallback(
    async (): Promise<BiometricCheckResult> => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const isDeviceSecure = await LocalAuthentication.isEnrolledAsync();
        
        if (!compatible || !isDeviceSecure) {
          return {
            available: false,
            biometryType: null,
            isDeviceSecure: false,
          };
        }

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        return {
          available: isDeviceSecure && types.length > 0,
          biometryType: types.length > 0 ? types[0] : null,
          isDeviceSecure,
        };
      } catch (error) {
        console.log('Error checking biometric:', error);
        return {
          available: false,
          biometryType: null,
          isDeviceSecure: false,
        };
      }
    },
    []
  );

  const authenticate = useCallback(
    async (): Promise<BiometricAuthResult> => {
      setIsLoading(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: false,
          promptMessage: 'Accede a AgrimensAPP con tu huella digital, rostro o PIN',
        });

        if (result.success) {
          return { success: true };
        } else {
          // result.error contiene el motivo exacto del rechazo
          return { success: false, error: result.error || 'Autenticación fallida' };
        }
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error de autenticación' 
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    checkBiometricAvailability,
    authenticate,
    isLoading,
  };
};
