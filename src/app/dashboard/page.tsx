"use client";

import { useUser } from '@clerk/nextjs';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { UpcomingPosts } from '@/components/dashboard/UpcomingPosts';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading dashboard...</div>;
  }

  // Mock data for now - will be replaced with Prisma queries later
  const stats = {
    postsCreated: 12,
    postsScheduled: 3,
    postsPublished: 8,
    postsToReview: 1,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'there'}! Here's your content overview.
          </p>
        </div>
      </div>
      
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
    </div>
  );
}