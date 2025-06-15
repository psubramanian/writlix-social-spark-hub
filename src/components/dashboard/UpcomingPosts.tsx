import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface UpcomingPostsProps {
  scheduledPostsCount: number;
}

export function UpcomingPosts({ scheduledPostsCount }: UpcomingPostsProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Scheduled Posts</CardTitle>
        <CardDescription>Your upcoming posts</CardDescription>
      </CardHeader>
      <CardContent>
        {scheduledPostsCount > 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-2">
                You have {scheduledPostsCount} scheduled posts
              </p>
              <Link href="/schedule">
                <Button variant="outline" size="sm">
                  View All Posts
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No posts scheduled yet</p>
            <Link href="/content">
              <Button variant="default">Create Content</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}