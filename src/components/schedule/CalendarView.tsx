"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Eye
} from 'lucide-react';
import type { ScheduledPost, SocialPlatform } from '@/types/schedule';
import { PLATFORM_CONFIG } from '@/types/schedule';

interface CalendarViewProps {
  posts: ScheduledPost[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPostSelect: (post: ScheduledPost) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  selectedDate,
  onDateSelect,
  onPostSelect
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty days for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month, -firstDayOfWeek + i + 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add empty days for next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return posts.filter(post => new Date(post.scheduledAt).toDateString() === dateStr);
  };

  // Get posts for selected date (for sidebar)
  const selectedDatePosts = getPostsForDate(selectedDate);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    const config = PLATFORM_CONFIG[platform];
    return (
      <div className={`w-4 h-4 rounded text-white text-xs flex items-center justify-center ${config.color}`}>
        {platform === 'linkedin' && '💼'}
        {platform === 'facebook' && '👥'}
        {platform === 'instagram' && '📷'}
        {platform === 'twitter' && '🐦'}
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700">
            {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h3>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/60 border border-purple-200/50 rounded-lg p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayInfo, index) => {
              const { date, isCurrentMonth } = dayInfo;
              const dayPosts = getPostsForDate(date);
              const hasOverdue = dayPosts.some(post => 
                new Date(post.scheduledAt) < new Date() && post.status === 'scheduled'
              );

              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(date)}
                  className={`
                    relative p-2 h-16 rounded-lg border transition-all duration-200 text-left
                    ${isCurrentMonth ? 'border-slate-200' : 'border-transparent'}
                    ${isSelected(date) ? 'bg-purple-100 border-purple-300' : 'hover:bg-slate-50'}
                    ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                  `}
                >
                  <div className={`text-sm font-medium ${
                    isToday(date) ? 'text-blue-600' : 
                    isSelected(date) ? 'text-purple-600' : 
                    isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {dayPosts.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        {dayPosts.slice(0, 3).map((post, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              hasOverdue ? 'bg-amber-400' : 'bg-purple-400'
                            }`}
                          />
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{dayPosts.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-slate-700">
            {selectedDate.toLocaleDateString([], { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        {selectedDatePosts.length === 0 ? (
          <div className="bg-white/60 border border-purple-200/50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No posts scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDatePosts.map(post => {
              const isOverdue = new Date(post.scheduledAt) < new Date() && post.status === 'scheduled';
              
              return (
                <div
                  key={post.id}
                  className={`bg-white/60 border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isOverdue ? 'border-amber-300' : 'border-purple-200/50'
                  }`}
                  onClick={() => onPostSelect(post)}
                >
                  <div className="flex items-start gap-3">
                    {getPlatformIcon(post.platform)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-700 truncate mb-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Clock className="h-3 w-3" />
                        {formatTime(new Date(post.scheduledAt))}
                        {isOverdue && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {post.content.substring(0, 80)}
                        {post.content.length > 80 && '...'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostSelect(post);
                      }}
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Calendar Legend */}
        <div className="bg-white/60 border border-purple-200/50 rounded-lg p-4">
          <h4 className="font-medium text-slate-700 mb-3">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-slate-600">Scheduled posts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span className="text-slate-600">Overdue posts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-slate-600">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;