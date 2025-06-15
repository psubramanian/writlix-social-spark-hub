"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Eye, 
  Send, 
  Trash2, 
  AlertCircle,
  Wifi,
  WifiOff,
  Calendar
} from 'lucide-react';
import type { ScheduledPost, SocialConnection, SocialPlatform } from '@/types/schedule';
import { PLATFORM_CONFIG } from '@/types/schedule';

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  onPost: (postId: string, platform: SocialPlatform) => Promise<void>;
  onPreview: (post: ScheduledPost) => void;
  onDelete: (postId: string) => Promise<void>;
  socialConnections: SocialConnection[];
  isLoading: boolean;
}

const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({
  posts,
  onPost,
  onPreview,
  onDelete,
  socialConnections,
  isLoading
}) => {
  // Group posts by time periods
  const groupedPosts = React.useMemo(() => {
    const now = new Date();
    const groups = {
      overdue: { label: 'Past Due', posts: [] as ScheduledPost[], isOverdue: true },
      today: { label: 'Today', posts: [] as ScheduledPost[], isOverdue: false },
      tomorrow: { label: 'Tomorrow', posts: [] as ScheduledPost[], isOverdue: false },
      thisWeek: { label: 'This Week', posts: [] as ScheduledPost[], isOverdue: false },
      later: { label: 'Later', posts: [] as ScheduledPost[], isOverdue: false },
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    posts.forEach(post => {
      const postDate = new Date(post.scheduledAt);
      postDate.setHours(0, 0, 0, 0);
      
      if (post.scheduledAt < now && post.status === 'scheduled') {
        groups.overdue.posts.push(post);
      } else if (postDate.getTime() === today.getTime()) {
        groups.today.posts.push(post);
      } else if (postDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.posts.push(post);
      } else if (postDate < weekEnd) {
        groups.thisWeek.posts.push(post);
      } else {
        groups.later.posts.push(post);
      }
    });

    // Sort posts within each group by scheduled time
    Object.values(groups).forEach(group => {
      group.posts.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });

    return groups;
  }, [posts]);

  const getSocialConnection = (platform: SocialPlatform) => {
    return socialConnections.find(conn => conn.platform === platform);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'posted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    const config = PLATFORM_CONFIG[platform];
    return (
      <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${config.color}`}>
        {platform === 'linkedin' && 'in'}
        {platform === 'facebook' && 'f'}
        {platform === 'instagram' && '📷'}
        {platform === 'twitter' && '𝕏'}
      </div>
    );
  };

  const canPost = (platform: SocialPlatform) => {
    const connection = getSocialConnection(platform);
    return connection?.isConnected === true;
  };

  const renderPostCard = (post: ScheduledPost, isOverdue: boolean = false) => {
    const connection = getSocialConnection(post.platform);
    const platformConfig = PLATFORM_CONFIG[post.platform];
    
    return (
      <div
        key={post.id}
        className={`bg-white/80 border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
          isOverdue 
            ? 'border-amber-300/70 bg-gradient-to-r from-amber-50/50 to-orange-50/50' 
            : 'border-purple-200/50'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Platform Icon & Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getPlatformIcon(post.platform)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-slate-800 truncate">{post.title}</h3>
                <Badge className={`${getStatusColor(post.status)} text-xs px-2 py-1`}>
                  {post.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(new Date(post.scheduledAt))}
                </div>
                {isOverdue && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Past Due</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {connection?.isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-1">
                {post.content.substring(0, 120)}
                {post.content.length > 120 && '...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(post)}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 rounded h-9 w-9 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {post.status === 'scheduled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPost(post.id, post.platform)}
                disabled={!canPost(post.platform) || isLoading}
                className={`${canPost(post.platform)
                  ? 'border-green-300 text-green-600 hover:bg-green-50'
                  : 'border-slate-300 text-slate-400 cursor-not-allowed'
                } rounded h-9 w-9 p-0`}
                title={!canPost(post.platform) ? `Connect ${platformConfig.name} to post` : 'Post now'}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(post.id)}
              className="border-red-300 text-red-600 hover:bg-red-50 rounded h-9 w-9 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-2xl p-8 border-2 border-dashed border-purple-300">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No scheduled posts</h3>
          <p className="text-slate-500">
            Schedule some content from the Data Seed page to see your posting timeline here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(groupedPosts).map(([key, group]) => {
        if (group.posts.length === 0) return null;
        
        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h3 className={`font-semibold ${group.isOverdue ? 'text-amber-700' : 'text-slate-700'}`}>
                {group.label}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {group.posts.length} post{group.posts.length !== 1 ? 's' : ''}
              </Badge>
              {group.isOverdue && (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            
            <div className="space-y-3">
              {group.posts.map(post => renderPostCard(post, group.isOverdue))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduledPostsList;