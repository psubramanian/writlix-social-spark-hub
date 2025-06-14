
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { checkAndRecoverSession } from '@/integrations/supabase/client';

interface DebugPanelProps {
  authInfo: {
    isAuthenticated: boolean;
    authLoading: boolean;
    recoveryAttempted: boolean;
    localStorage: Record<string, string | null>;
    sessionStorage: Record<string, string | null>;
  };
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ authInfo }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-8 p-3 bg-black/80 text-xs text-white rounded">
      <div className="flex justify-between items-center mb-2">
        <p>Debug Tools:</p>
        <div className="space-x-2">
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              toast({ title: "Storage Cleared", description: "All localStorage and sessionStorage data has been cleared." });
            }}
            className="text-red-400 underline text-xs px-2 py-1"
          >
            Clear All Storage
          </button>
          <button 
            onClick={() => {
              // Force session recovery
              checkAndRecoverSession(true).then(recovered => {
                toast({ 
                  title: recovered ? "Session Recovered" : "No Session Found", 
                  description: recovered ? "Session has been successfully recovered." : "No session available to recover." 
                });
              });
            }}
            className="text-blue-400 underline text-xs px-2 py-1"
          >
            Force Session Recovery
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <strong className="text-gray-400">localStorage:</strong>
          {Object.entries(authInfo.localStorage).map(([key, value]) => (
            <div key={key}>{key}: {value || 'null'}</div>
          ))}
        </div>
        <div>
          <strong className="text-gray-400">sessionStorage:</strong>
          {Object.entries(authInfo.sessionStorage).map(([key, value]) => (
            <div key={key}>{key}: {value || 'null'}</div>
          ))}
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div><strong className="text-gray-400">Auth Status:</strong> {authInfo.isAuthenticated ? 'Logged In' : 'Logged Out'}</div>
        <div><strong className="text-gray-400">Is Loading:</strong> {authInfo.authLoading ? 'Yes' : 'No'}</div>
        <div><strong className="text-gray-400">Recovery Attempted:</strong> {authInfo.recoveryAttempted ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};
