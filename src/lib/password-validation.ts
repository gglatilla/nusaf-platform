// Password validation utility
// Requirements:
// - Minimum 12 characters
// - Must contain: uppercase, lowercase, number, symbol
// - Block common passwords

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

const MIN_PASSWORD_LENGTH = 12;

// Common passwords to block (subset of top 10,000)
// Full list would be loaded from a file in production
const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "passw0rd",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "password1",
  "password123",
  "batman",
  "login",
  "welcome",
  "solo",
  "admin",
  "admin123",
  "qwerty123",
  "1234567890",
  "guest",
  "master123",
  "changeme",
  "111111",
  "000000",
  "123456789",
  "password12",
  "password1234",
  "welcome1",
  "welcome123",
  "hello123",
  "charlie",
  "donald",
  "loveme",
  "access",
  "access1",
  "starwars",
  "hunter",
  "killer",
  "secret",
  "test123",
  "zxcvbn",
  "asdfgh",
  "asdfghjkl",
  "qwertyuiop",
  "letmein1",
  "p@ssw0rd",
  "p@ssword",
  "pa$$word",
  "passw0rd1",
  "12345678901",
  "1q2w3e4r",
  "1q2w3e",
  "1qaz2wsx",
  "qwert12345",
  "computer",
  "princess",
  "internet",
  "whatever",
  "cheese",
  "coffee",
  "summer",
  "winter",
  "spring",
  "autumn",
  "monday",
  "friday",
  "soccer",
  "hockey",
  "tennis",
  "pepper",
  "ginger",
  "joshua",
  "andrew",
  "jessica",
  "jennifer",
  "matthew",
  "daniel",
  "jordan",
  "justin",
  "michelle",
  "nicole",
  "thunder",
  "buster",
  "jordan23",
  "password2",
  "password3",
]);

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for symbol
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("This password is too common. Please choose a more unique password");
  }

  // Check for common patterns
  if (hasCommonPattern(password)) {
    errors.push("Password contains a common pattern. Please use a more unique password");
  }

  const isValid = errors.length === 0;
  const strength = calculateStrength(password, errors.length);

  return { isValid, errors, strength };
}

function hasCommonPattern(password: string): boolean {
  const lower = password.toLowerCase();

  // Check for sequential characters
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "zyxwvutsrqponmlkjihgfedcba",
    "0123456789",
    "9876543210",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  for (const seq of sequences) {
    // Check for 4+ consecutive characters from any sequence
    for (let i = 0; i <= seq.length - 4; i++) {
      if (lower.includes(seq.substring(i, i + 4))) {
        return true;
      }
    }
  }

  // Check for repeated characters (3+ of the same)
  if (/(.)\1{2,}/.test(password)) {
    return true;
  }

  return false;
}

function calculateStrength(
  password: string,
  errorCount: number
): "weak" | "fair" | "good" | "strong" {
  if (errorCount > 2) return "weak";
  if (errorCount > 0) return "fair";

  let score = 0;

  // Length bonus
  if (password.length >= 16) score += 2;
  else if (password.length >= 14) score += 1;

  // Variety bonus
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  const varietyCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  score += varietyCount - 2; // -1 to 2 based on variety

  // Multiple symbols/numbers bonus
  const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;

  if (symbolCount >= 2) score += 1;
  if (numberCount >= 2) score += 1;

  if (score >= 4) return "strong";
  if (score >= 2) return "good";
  return "fair";
}

// Get user-friendly password requirements text
export function getPasswordRequirements(): string[] {
  return [
    `At least ${MIN_PASSWORD_LENGTH} characters`,
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one number (0-9)",
    "At least one special character (!@#$%^&* etc.)",
    "Cannot be a commonly used password",
  ];
}

// Hash password using bcrypt (for use in API routes)
export async function hashPassword(password: string): Promise<string> {
  const { hash } = await import("bcryptjs");
  const saltRounds = 12;
  return hash(password, saltRounds);
}
