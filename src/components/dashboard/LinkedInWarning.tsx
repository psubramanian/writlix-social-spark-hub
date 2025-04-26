
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LinkedInWarning() {
  return (
    <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-amber-800 font-medium mb-2">LinkedIn not connected</h3>
      <p className="text-amber-700 text-sm mb-3">
        Connect your LinkedIn account to start scheduling and posting content.
      </p>
      <Link to="/settings">
        <Button size="sm" variant="outline">
          Connect LinkedIn
        </Button>
      </Link>
    </div>
  );
}
