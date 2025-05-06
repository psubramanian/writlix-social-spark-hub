
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import ReCAPTCHA from 'react-google-recaptcha';

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupFormValues = z.infer<typeof signupSchema> & {
  captchaToken?: string;
};

interface SignupFormProps {
  onSubmit: (data: SignupFormValues) => Promise<void>;
  isLoading: boolean;
}

// Supabase site key for reCAPTCHA
const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // This is a test key that always passes

export const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<boolean>(false);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    // Verify captcha is completed before submission
    if (!captchaToken) {
      setCaptchaError(true);
      return;
    }
    
    try {
      // Submit the form with the captcha token
      await onSubmit({
        ...data,
        captchaToken: captchaToken
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Visible reCAPTCHA */}
        <div className="my-4">
          <ReCAPTCHA
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
          {captchaError && (
            <p className="text-sm text-destructive mt-2">
              Please complete the captcha verification
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Create Account
        </Button>
      </form>
    </Form>
  );
};
