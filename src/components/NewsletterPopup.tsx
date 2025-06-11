
import React, { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');

export function NewsletterPopup({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim().toLowerCase();

    try {
      emailSchema.parse(trimmedEmail);
      setIsSubmitting(true);

      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: trimmedEmail } as any);

      if (error) {
        if (
          error.message?.toLowerCase().includes('duplicate') ||
          error.message?.toLowerCase().includes('unique')
        ) {
          toast.error('This email is already subscribed.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Thank you for subscribing!');
      setEmail('');
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        toast.error('An error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-newsletter-popup rounded-xl border-none p-0 overflow-hidden">
        <div className="bg-newsletter-background p-8 text-center">
          <div className="mb-4 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-gift"
            >
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect width="20" height="5" x="2" y="7"></rect>
              <line x1="12" x2="12" y1="22" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">SUBSCRIBE TODAY</h2>
          <p className="text-white/90 mb-6">
            It's good to be connected! We'll share our newsletter with great content. Stay tuned.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pr-12 bg-white/10 text-white placeholder-white/70 border-none"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={isSubmitting}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {error && <p className="text-red-200 text-sm">{error}</p>}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
