
/**
 * Clear all auth-related local storage items
 */
export function clearAuthLocalStorage() {
  localStorage.removeItem('profile_skip_attempted');
  localStorage.removeItem('profile_completed');
  localStorage.removeItem('profile_bypass_attempts');
  localStorage.removeItem('auth_active');
  localStorage.removeItem('auth_timestamp');
  sessionStorage.removeItem('auth_flow_started');
  sessionStorage.removeItem('auth_provider');
  sessionStorage.removeItem('auth_redirect_url');
  sessionStorage.removeItem('auth_local_flags');
}

/**
 * Restore auth flags from session storage to local storage
 */
export function restoreAuthLocalFlags() {
  try {
    const savedFlags = sessionStorage.getItem('auth_local_flags');
    if (savedFlags) {
      const flags = JSON.parse(savedFlags);
      
      // Only restore if current flags are missing
      if (flags.profile_completed && !localStorage.getItem('profile_completed')) {
        localStorage.setItem('profile_completed', flags.profile_completed);
        console.log("[AUTH] Restored profile_completed flag from session storage");
      }
      
      if (flags.profile_skip_attempted && !localStorage.getItem('profile_skip_attempted')) {
        localStorage.setItem('profile_skip_attempted', flags.profile_skip_attempted);
        console.log("[AUTH] Restored profile_skip_attempted flag from session storage");
      }
    }
  } catch (e) {
    console.warn("[AUTH] Error restoring auth flags:", e);
  }
}
