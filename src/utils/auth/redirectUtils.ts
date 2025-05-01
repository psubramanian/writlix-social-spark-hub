
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Auth redirect hook
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  
  const redirectToLogin = useCallback(() => {
    console.log("[AUTH] Redirecting to login page");
    navigate('/login');
  }, [navigate]);
  
  const redirectToDashboard = useCallback(() => {
    console.log("[AUTH] Redirecting to dashboard");
    navigate('/dashboard');
  }, [navigate]);
  
  return { redirectToLogin, redirectToDashboard };
}
