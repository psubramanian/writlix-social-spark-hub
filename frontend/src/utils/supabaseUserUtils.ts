
/**
 * This file re-exports the functions from the new auth module structure
 * for backwards compatibility during refactoring.
 * @deprecated Use @/utils/auth imports directly instead
 */

export { ensureProfileExists, isProfileComplete } from './auth/profileUtils';
export { useAuthRedirect } from './auth/redirectUtils';
export { clearAuthLocalStorage, restoreAuthLocalFlags } from './auth/storageUtils';
