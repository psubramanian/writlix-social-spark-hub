
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AuthErrorAlertProps {
  message: string | null;
}

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ message }) => {
  if (!message) return null;
  
  // Extract specific error types for better messaging
  let title = "Authentication Error";
  let description = message;
  
  // Parse common Supabase auth errors for better user feedback
  if (message.includes('captcha') || message.includes('CAPTCHA') || message.includes('invalid-input-response')) {
    title = "CAPTCHA Verification Failed";
    description = "Please complete the CAPTCHA verification correctly and try again.";
  } else if (message.includes('email already exists')) {
    title = "Email Already Registered";
    description = "This email address is already registered. Please try logging in instead.";
  } else if (message.includes('rate limit')) {
    title = "Too Many Attempts";
    description = "You've made too many attempts. Please wait a moment and try again.";
  } else if (message.includes('invalid credentials')) {
    title = "Invalid Credentials";
    description = "The email or password you entered is incorrect. Please try again.";
  } else if (message.includes('token') && message.includes('expired')) {
    title = "Session Expired";
    description = "Your verification has expired. Please try again.";
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};
