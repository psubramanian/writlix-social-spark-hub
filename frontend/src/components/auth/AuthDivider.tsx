
import React from 'react';

interface AuthDividerProps {
  text: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text }) => {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
};
