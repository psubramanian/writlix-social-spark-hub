
import React from 'react';

export const LoginPageHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2">
        <div className="bg-writlix-blue rounded-md p-1">
          <span className="font-bold text-white text-2xl">W</span>
        </div>
        <h1 className="text-3xl font-bold">Writlix</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Your LinkedIn content creator and scheduler</p>
    </div>
  );
};
