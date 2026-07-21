/**
 * adminAuth.ts
 *
 * Lightweight admin authentication helpers.
 *
 * Auth flag  → sessionStorage  (auto-clears when the browser tab/session closes)
 * Password   → localStorage    (persists so a changed password survives page refresh)
 */

const SESSION_KEY = 'amgoi_admin_session';
const PASSWORD_KEY = 'amgoi_admin_password';
const DEFAULT_PASSWORD = 'admin123';
export const ADMIN_USERNAME = 'admin';

/** Returns the current admin password (custom if set, otherwise the default). */
export function getAdminPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_PASSWORD;
}

/** Persists a new admin password to localStorage. */
export function setAdminPassword(password: string): void {
  localStorage.setItem(PASSWORD_KEY, password);
}

/** Returns true only when the session flag exists in sessionStorage. */
export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

/** Marks the current session as authenticated. */
export function setAdminAuthenticated(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

/** Clears the session auth flag immediately (logout). */
export function clearAdminAuth(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Returns true when `input` matches the stored admin password. */
export function verifyPassword(input: string): boolean {
  return input === getAdminPassword();
}
