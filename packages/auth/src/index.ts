// Auth configuration
export { authOptions, getRedirectUrl } from "./config";
export type { AuthUser, UserType } from "./config";

// Password validation
export {
  validatePassword,
  getPasswordRequirements,
  hashPassword,
} from "./password-validation";
export type { PasswordValidationResult } from "./password-validation";

// Device tracking
export {
  parseUserAgent,
  generateDeviceHash,
  checkAndRecordDevice,
  getUserDevices,
  formatNewDeviceAlertEmail,
} from "./device-tracking";
