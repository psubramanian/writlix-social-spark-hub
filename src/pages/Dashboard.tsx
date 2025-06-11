
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, subMonths } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { LinkedInWarning } from '@/components/dashboard/LinkedInWarning';
import { UpcomingPosts } from '@/components/dashboard/UpcomingPosts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const { stats, loading } = useDashboardStats(date);

  // Generate last 12 months for the selector
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: d.toISOString(),
      label: format(d, "MMMM yyyy")
    };
  });
  
  const formatDate = (date: Date) => format(date, "MMMM yyyy");
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your content and performance</p>
        </div>
        
        <Select
          value={date.toISOString()}
          onValueChange={(value) => setDate(new Date(value))}
        >
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue>
                {formatDate(date)}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {last12Months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {!user?.linkedInConnected && <LinkedInWarning />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatCard
          title="Posts Created"
          value={stats.postsCreated}
          isLoading={loading}
        />
        <DashboardStatCard
          title="Posts Scheduled"
          value={stats.postsScheduled}
          isLoading={loading}
        />
        <DashboardStatCard
          title="Posts Published"
          value={stats.postsPublished}
          isLoading={loading}
        />
        <DashboardStatCard
          title="To Be Reviewed"
          value={stats.postsToReview}
          isLoading={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingPosts scheduledPostsCount={stats.postsScheduled} />
        <QuickActions />
      </div>
    </div>
  );
}
