
/**
 * Clear all auth-related local storage items
 */
export function clearAuthLocalStorage() {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] Clearing all auth-related storage`);
  
  try {
    // Clear all auth-related localStorage items
    localStorage.removeItem('profile_skip_attempted');
    localStorage.removeItem('profile_completed');
    localStorage.removeItem('profile_bypass_attempts');
    localStorage.removeItem('auth_active');
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('auth_email');
    
    // Also clear any Supabase specific auth items
    localStorage.removeItem('writlix_supabase_auth');
    
    // Clear session storage items
    sessionStorage.removeItem('auth_flow_started');
    sessionStorage.removeItem('auth_provider');
    sessionStorage.removeItem('auth_redirect_url');
    sessionStorage.removeItem('auth_local_flags');
    
    console.log(`[AUTH ${timestamp}] Successfully cleared auth storage`);
  } catch (error) {
    console.error(`[AUTH ${timestamp}] Error clearing auth storage:`, error);
  }
}

/**
 * Restore auth flags from session storage to local storage
 * with enhanced logging and validation
 */
export function restoreAuthLocalFlags() {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[AUTH ${timestamp}] Attempting to restore auth flags from session storage`);
    
    const savedFlags = sessionStorage.getItem('auth_local_flags');
    if (!savedFlags) {
      console.log(`[AUTH ${timestamp}] No saved flags found in session storage`);
      return;
    }
    
    const flags = JSON.parse(savedFlags);
    
    // Check if flags is a valid object
    if (!flags || typeof flags !== 'object') {
      console.warn(`[AUTH ${timestamp}] Invalid flags format in session storage`);
      return;
    }
    
    // Track restored items
    let restoredCount = 0;
    
    // Only restore if current flags are missing
    if (flags.profile_completed && !localStorage.getItem('profile_completed')) {
      localStorage.setItem('profile_completed', flags.profile_completed);
      restoredCount++;
      console.log(`[AUTH ${timestamp}] Restored profile_completed flag (${flags.profile_completed}) from session storage`);
    }
    
    if (flags.profile_skip_attempted && !localStorage.getItem('profile_skip_attempted')) {
      localStorage.setItem('profile_skip_attempted', flags.profile_skip_attempted);
      restoredCount++;
      console.log(`[AUTH ${timestamp}] Restored profile_skip_attempted flag (${flags.profile_skip_attempted}) from session storage`);
    }
    
    console.log(`[AUTH ${timestamp}] Auth flag restoration complete - restored ${restoredCount} items`);
  } catch (e) {
    console.warn(`[AUTH ${timestamp}] Error restoring auth flags:`, e);
  }
}

/**
 * Save auth flags from local storage to session storage
 * for retrieval after redirect
 */
export function saveAuthLocalFlagsToSession() {
  const timestamp = new Date().toISOString();
  
  try {
    const flags = {
      profile_completed: localStorage.getItem('profile_completed'),
      profile_skip_attempted: localStorage.getItem('profile_skip_attempted')
    };
    
    sessionStorage.setItem('auth_local_flags', JSON.stringify(flags));
    console.log(`[AUTH ${timestamp}] Saved auth flags to session storage:`, flags);
    
    return true;
  } catch (error) {
    console.error(`[AUTH ${timestamp}] Error saving auth flags to session:`, error);
    return false;
  }
}

/**
 * Get all auth-related storage as an object for debugging
 */
export function getAllAuthStorage() {
  return {
    localStorage: {
      profile_completed: localStorage.getItem('profile_completed'),
      profile_skip_attempted: localStorage.getItem('profile_skip_attempted'),
      profile_bypass_attempts: localStorage.getItem('profile_bypass_attempts'),
      auth_active: localStorage.getItem('auth_active'),
      auth_timestamp: localStorage.getItem('auth_timestamp'),
      auth_email: localStorage.getItem('auth_email'),
    },
    sessionStorage: {
      auth_flow_started: sessionStorage.getItem('auth_flow_started'),
      auth_provider: sessionStorage.getItem('auth_provider'),
      auth_redirect_url: sessionStorage.getItem('auth_redirect_url'),
      auth_local_flags: sessionStorage.getItem('auth_local_flags')
    }
  };
}
