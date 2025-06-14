
import { Button } from '@/components/ui/button';

interface LinkedInWarningProps {
  onClick?: () => void;
}

export function LinkedInWarning({ onClick }: LinkedInWarningProps) {
  return (
    <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-amber-800 font-medium mb-2">LinkedIn not connected</h3>
      <p className="text-amber-700 text-sm mb-3">
        Connect your LinkedIn account to start scheduling and posting content.
      </p>
      <Button 
        size="sm" 
        variant="outline"
        onClick={onClick}
      >
        Connect LinkedIn
      </Button>
    </div>
  );
}
