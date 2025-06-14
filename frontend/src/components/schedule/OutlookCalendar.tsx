
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';

interface OutlookCalendarProps {
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
  onPostNow?: (postId: string, platform: string) => void;
  userTimezone: string;
  formatScheduleDate: (dateString: string, timezone: string) => string;
  loading?: boolean;
}

const OutlookCalendar = ({ 
  posts, 
  onPostClick, 
  onPostNow,
  userTimezone,
  formatScheduleDate,
  loading = false
}: OutlookCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Group posts by date
  const getPostsForDate = (date: Date): ScheduledPost[] => {
    return posts.filter(post => {
      try {
        const postDate = parseISO(post.next_run_at);
        const postDateInTz = toZonedTime(postDate, post.timezone || userTimezone);
        const targetDateInTz = toZonedTime(date, userTimezone);
        
        return isSameDay(postDateInTz, targetDateInTz);
      } catch (error) {
        console.error("Error filtering posts by date:", error);
        return false;
      }
    });
  };

  const formatPostTime = (dateString: string, timezone: string) => {
    try {
      const date = parseISO(dateString);
      return formatInTimeZone(date, timezone || userTimezone, 'h:mm a');
    } catch (error) {
      console.error("Error formatting post time:", error);
      return "Invalid time";
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const renderPost = (post: ScheduledPost) => {
    const time = formatPostTime(post.next_run_at, post.timezone || userTimezone);
    const isPastDue = new Date(post.next_run_at) < new Date();
    
    return (
      <div
        key={post.id}
        className={`
          text-xs p-1.5 mb-1 rounded cursor-pointer border transition-colors
          ${isPastDue 
            ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' 
            : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
          }
        `}
        onClick={() => onPostClick(post)}
        title={`${post.content_ideas?.title || 'Untitled'} - ${time}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="font-medium truncate">
              {time}
            </span>
          </div>
          <Edit className="w-3 h-3 ml-1 flex-shrink-0 opacity-60" />
        </div>
        <div className="truncate font-medium mt-0.5">
          {post.content_ideas?.title || 'Untitled Post'}
        </div>
        {isPastDue && (
          <Badge variant="outline" className="text-xs mt-1 bg-amber-100 text-amber-700 border-amber-300">
            Past Due
          </Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Calendar...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground border-b">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {monthDays.map(day => {
            const dayPosts = getPostsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-24 p-1 border border-gray-100 
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                `}
              >
                <div className={`
                  text-sm font-medium mb-1 
                  ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {format(day, 'd')}
                </div>
                
                {/* Posts for this day */}
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map(post => renderPost(post))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200"></div>
            <span>Past Due</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutlookCalendar;
