
import { format } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScheduledPost {
  id: string;
  content_ideas?: {
    title: string;
    status: string;
  };
  schedule_settings?: Array<{
    next_run_at: string;
    time_of_day: string;
    timezone: string;
  }>;
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  postingId: string | null;
  onPostNow: (postId: string) => void;
  loading?: boolean;
}

export function ScheduledPostsList({ posts, postingId, onPostNow, loading = false }: ScheduledPostsListProps) {
  const formatScheduleTime = (post: ScheduledPost) => {
    if (!post.schedule_settings?.[0]) return 'Not scheduled';
    
    const settings = post.schedule_settings[0];
    const nextRun = new Date(settings.next_run_at);
    const time = settings.time_of_day;
    const timezone = settings.timezone || 'UTC';
    
    const formattedDate = format(nextRun, 'PPP');
    const formattedTime = format(nextRun, 'p');
    
    return `${formattedDate} at ${formattedTime} (${timezone})`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Posts ({posts.length})</CardTitle>
        <CardDescription>Manage your upcoming LinkedIn posts</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="border rounded-md p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{post.content_ideas?.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatScheduleTime(post)}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {post.content_ideas?.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPostNow(post.id)}
                    disabled={postingId === post.id}
                    className="ml-4"
                  >
                    {postingId === post.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts scheduled yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Move posts from Review to Scheduled in the Data Seed page
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
