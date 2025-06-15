"use client";

import { useUser } from '@clerk/nextjs';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { UpcomingPosts } from '@/components/dashboard/UpcomingPosts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import AppLayout from '@/components/layout/AppLayout';

export default function Dashboard() {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Mock data for now - will be replaced with Prisma queries later
  const stats = {
    postsCreated: 12,
    postsScheduled: 3,
    postsPublished: 8,
    postsToReview: 1,
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatCard
          title="Posts Created"
          value={stats.postsCreated}
        />
        <DashboardStatCard
          title="Posts Scheduled"
          value={stats.postsScheduled}
        />
        <DashboardStatCard
          title="Posts Published"
          value={stats.postsPublished}
        />
        <DashboardStatCard
          title="To Be Reviewed"
          value={stats.postsToReview}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingPosts scheduledPostsCount={stats.postsScheduled} />
        <QuickActions />
      </div>
    </AppLayout>
  );
}