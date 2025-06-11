
import React from 'react';
import { cn } from '@/lib/utils';
import { CrownIcon } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-sm bg-primary/10 text-primary border border-primary/20",
      className
    )}>
      <CrownIcon className="h-3 w-3" />
      <span>PRO</span>
    </div>
  );
}
