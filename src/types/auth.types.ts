export interface AuthState {
  isLocked: boolean;
  isPinSet: boolean;
  isBiometricEnabled: boolean;
  failedAttempts: number;
}
