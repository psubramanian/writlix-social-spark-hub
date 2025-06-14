
// Export all auth utilities from a single entry point
export { getCurrentUser } from './getCurrentUser';
export { 
  ensureProfileExists, 
  isProfileComplete,
  markProfileComplete,
  markProfileIncomplete
} from './profileUtils';
export { useAuthRedirect } from './redirectUtils';
export { 
  clearAuthLocalStorage, 
  restoreAuthLocalFlags,
  saveAuthLocalFlagsToSession,
  getAllAuthStorage
} from './storageUtils';
export { useAuth } from '../../contexts/auth/useAuth';
