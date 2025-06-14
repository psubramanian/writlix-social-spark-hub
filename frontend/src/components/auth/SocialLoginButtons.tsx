
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SocialLoginButtonsProps {
  onLogin: (provider: 'google' | 'linkedin_oidc') => Promise<void>;
  isLoading: boolean;
  activeProvider: string | null;
  actionType: 'login' | 'signup';
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onLogin,
  isLoading,
  activeProvider,
  actionType
}) => {
  const buttonText = actionType === 'login' ? 'Continue with' : 'Sign up with';
  
  return (
    <div className="space-y-2">
      <Button 
        className="w-full bg-[#4285F4] hover:bg-[#4285F4]/90 text-white"
        onClick={() => onLogin('google')}
        disabled={isLoading}
      >
        {isLoading && activeProvider === 'google' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        {buttonText} Google
      </Button>
      
      <Button 
        className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
        onClick={() => onLogin('linkedin_oidc')}
        disabled={isLoading}
      >
        {isLoading && activeProvider === 'linkedin_oidc' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
          </svg>
        )}
        {buttonText} LinkedIn
      </Button>
    </div>
  );
};
