
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error("Authentication error:", authError);
    return null;
  }
  
  return user;
}

export function useAuthRedirect() {
  const navigate = useNavigate();
  
  const redirectToLogin = () => {
    navigate('/login');
  };
  
  return { redirectToLogin };
}
