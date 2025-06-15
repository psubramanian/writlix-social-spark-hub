"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ScheduleSettings from '@/components/schedule/ScheduleSettings';
import ScheduledPostsList from '@/components/schedule/ScheduledPostsList';
import CalendarView from '@/components/schedule/CalendarView';
import { Button } from '@/components/ui/button';
import { Calendar, List } from 'lucide-react';
import type { ScheduledPost, ScheduleSettings as ScheduleSettingsType, SocialConnection } from '@/types/schedule';

const Schedule = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPostForPreview, setSelectedPostForPreview] = useState<ScheduledPost | null>(null);
  
  // Mock data - will replace with real data later
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettingsType | null>({
    id: '1',
    userId: 'user_123',
    frequency: 'daily',
    timeOfDay: '09:00',
    timezone: 'America/New_York',
    isActive: true,
    nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [scheduledPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      userId: 'user_123',
      contentId: 'content_1',
      title: 'Market Analysis - Weekly Insights',
      content: 'This week\'s market trends show interesting patterns in the tech sector. Key insights include growth in AI startups and sustainable technology investments.',
      platform: 'linkedin',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      status: 'scheduled',
      timezone: 'America/New_York',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      userId: 'user_123',
      contentId: 'content_2',
      title: 'Social Media Tips',
      content: 'Boost your engagement with these proven social media strategies. Remember to post consistently and engage with your audience.',
      platform: 'facebook',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'scheduled',
      timezone: 'America/New_York',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      userId: 'user_123',
      contentId: 'content_3',
      title: 'Behind the Scenes',
      content: 'Check out our team working on the latest project! #TeamWork #BehindTheScenes #Innovation',
      platform: 'instagram',
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      status: 'scheduled',
      timezone: 'America/New_York',
      imageUrl: 'https://example.com/team-photo.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [socialConnections] = useState<SocialConnection[]>([
    { platform: 'linkedin', isConnected: true, lastConnected: new Date() },
    { platform: 'facebook', isConnected: true, lastConnected: new Date() },
    { platform: 'instagram', isConnected: false, error: 'Token expired' },
    { platform: 'twitter', isConnected: false },
  ]);

  const handleSaveSettings = async (settings: Partial<ScheduleSettingsType>) => {
    // TODO: Implement API call to save settings
    console.log('Saving schedule settings:', settings);
    setScheduleSettings(prev => prev ? { ...prev, ...settings } : null);
  };

  const handlePostNow = async (postId: string, platform: string) => {
    // TODO: Implement social media posting
    console.log('Posting to', platform, 'post ID:', postId);
  };

  const handlePreviewPost = (post: ScheduledPost) => {
    setSelectedPostForPreview(post);
    // TODO: Open preview dialog
    console.log('Preview post:', post);
  };

  const handleDeletePost = async (postId: string) => {
    // TODO: Implement post deletion
    console.log('Deleting post:', postId);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-black via-slate-800 to-purple-600 bg-clip-text text-transparent">
                Schedule
              </h1>
              <p className="text-slate-600 text-xs">Manage your scheduled social media posts</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-7 text-xs' 
                  : 'border-purple-300 text-purple-600 hover:bg-purple-50 h-7 text-xs'
                }
              >
                <List className="h-3 w-3 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-7 text-xs' 
                  : 'border-purple-300 text-purple-600 hover:bg-purple-50 h-7 text-xs'
                }
              >
                <Calendar className="h-3 w-3 mr-1" />
                Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
          {/* Schedule Settings */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-purple-50/50 border border-purple-200/30 shadow-xl rounded-xl p-3 h-full flex flex-col max-h-full">
              <div className="flex-shrink-0 pb-2">
                <h2 className="text-sm font-semibold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent">
                  Posting Schedule
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0">
                <ScheduleSettings
                  settings={scheduleSettings}
                  onSave={handleSaveSettings}
                  isLoading={false}
                />
              </div>
            </div>
          </div>

          {/* Posts View */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-purple-50/50 border border-purple-200/30 shadow-xl rounded-xl p-3 h-full flex flex-col max-h-full">
              <div className="flex-shrink-0 pb-2">
                <h2 className="text-sm font-semibold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent">
                  {viewMode === 'list' ? 'Scheduled Posts' : 'Calendar View'}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {viewMode === 'list' ? (
                  <ScheduledPostsList
                    posts={scheduledPosts}
                    onPost={handlePostNow}
                    onPreview={handlePreviewPost}
                    onDelete={handleDeletePost}
                    socialConnections={socialConnections}
                    isLoading={false}
                  />
                ) : (
                  <CalendarView
                    posts={scheduledPosts}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onPostSelect={(post) => console.log('Selected post:', post)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Schedule;