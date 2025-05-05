
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthErrorAlertProps {
  message: string | null;
}

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
