
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface UpcomingPostsProps {
  scheduledPostsCount: number;
}

export function UpcomingPosts({ scheduledPostsCount }: UpcomingPostsProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Upcoming Posts</CardTitle>
        <CardDescription>Posts scheduled to be published soon</CardDescription>
      </CardHeader>
      <CardContent>
        {scheduledPostsCount > 0 ? (
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <p className="font-medium">10 Essential Tips for Remote Work</p>
              <p className="text-sm text-muted-foreground mt-1">Scheduled for tomorrow at 9:00 AM</p>
            </div>
            <div className="border rounded-md p-4">
              <p className="font-medium">The Future of AI in Marketing</p>
              <p className="text-sm text-muted-foreground mt-1">Scheduled for Apr 27 at 1:00 PM</p>
            </div>
            <Link to="/schedule">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All Scheduled Posts
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No posts scheduled yet</p>
            <Link to="/data-seed">
              <Button variant="default">Create Content</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
