
/**
 * Clear all auth-related local storage items
 */
export function clearAuthLocalStorage() {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] Clearing all auth-related storage`);
  
  try {
    // Clear all auth-related localStorage items - enhanced to catch more keys
    localStorage.removeItem('profile_skip_attempted');
    localStorage.removeItem('profile_completed');
    localStorage.removeItem('profile_bypass_attempts');
    localStorage.removeItem('auth_active');
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('auth_email');
    
    // Clean all Supabase specific auth items with a more thorough approach
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || 
          key.includes('sb-') || 
          key === 'writlix_supabase_auth') {
        localStorage.removeItem(key);
        console.log(`[AUTH ${timestamp}] Removed localStorage key: ${key}`);
      }
    });
    
    // Clear session storage items
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('auth_') || 
          key.startsWith('supabase.auth.') || 
          key.includes('sb-')) {
        sessionStorage.removeItem(key);
        console.log(`[AUTH ${timestamp}] Removed sessionStorage key: ${key}`);
      }
    });
    
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
    
    let flags;
    try {
      flags = JSON.parse(savedFlags);
    } catch (e) {
      console.warn(`[AUTH ${timestamp}] Invalid JSON format in saved flags: ${savedFlags}`);
      sessionStorage.removeItem('auth_local_flags');
      return;
    }
    
    // Check if flags is a valid object
    if (!flags || typeof flags !== 'object') {
      console.warn(`[AUTH ${timestamp}] Invalid flags format in session storage`);
      sessionStorage.removeItem('auth_local_flags');
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
    
    // Clean up session storage after successful restoration
    if (restoredCount > 0) {
      sessionStorage.removeItem('auth_local_flags');
    }
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

/**
 * Perform a complete auth reset - useful for resolving login issues
 */
export function performAuthReset() {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] Performing complete auth reset`);
  
  // First clear all storage
  clearAuthLocalStorage();
  
  // Then also clear any other potentially problematic items
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || 
          key.includes('sb-') || 
          key.startsWith('auth_') || 
          key.startsWith('profile_')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || 
          key.includes('sb-') || 
          key.startsWith('auth_') || 
          key.startsWith('profile_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log(`[AUTH ${timestamp}] Auth reset completed successfully`);
    return true;
  } catch (error) {
    console.error(`[AUTH ${timestamp}] Error during auth reset:`, error);
    return false;
  }
}
