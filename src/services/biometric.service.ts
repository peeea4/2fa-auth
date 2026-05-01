import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricAvailability = {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedAuthenticationTypes: LocalAuthentication.AuthenticationType[];
  enrolledLevel: LocalAuthentication.SecurityLevel;
};

export type BiometricAuthResult = {
  success: boolean;
  usedFallbackToPin: boolean;
  error?: LocalAuthentication.LocalAuthenticationError | 'not_available';
  warning?: string;
};

type AuthenticateOptions = {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
};

class BiometricService {
  async getAvailability(): Promise<BiometricAvailability> {
    const [hasHardware, isEnrolled, supportedAuthenticationTypes, enrolledLevel] =
      await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        LocalAuthentication.getEnrolledLevelAsync(),
      ]);

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      supportedAuthenticationTypes,
      enrolledLevel,
    };
  }

  async isAvailable(): Promise<boolean> {
    const availability = await this.getAvailability();
    return availability.isAvailable;
  }

  async authenticate(options?: AuthenticateOptions): Promise<BiometricAuthResult> {
    const availability = await this.getAvailability();

    if (!availability.isAvailable) {
      return {
        success: false,
        usedFallbackToPin: true,
        error: 'not_available',
        warning: 'Biometric auth unavailable, fallback to PIN required.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options?.promptMessage ?? 'Unlock Authenticator',
      cancelLabel: options?.cancelLabel ?? 'Cancel',
      fallbackLabel: options?.fallbackLabel ?? 'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return {
        success: true,
        usedFallbackToPin: false,
      };
    }

    const mustFallbackToPin = !result.success;
    return {
      success: false,
      usedFallbackToPin: mustFallbackToPin,
      error: result.error,
      warning: 'Biometric auth was not completed, fallback to PIN required.',
    };
  }
}

export const biometricService = new BiometricService();

