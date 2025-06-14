
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react'; // Changed to use Clerk's useUser hook
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
  const { user, isLoaded } = useUser(); // Use Clerk's useUser hook

  // It's good practice to handle the loading state from useUser
  if (!isLoaded) {
    // You can return a loading spinner or null here
    // For consistency, you might want to use the same LoadingScreen as in App.tsx
    return <div>Loading dashboard...</div>; // Or a proper loading component
  }
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
      
      {/* We'll need to check how linkedInConnected is populated with Clerk. 
    This might involve custom metadata or checking session tokens if LinkedIn is a federated provider.
    For now, let's assume 'linkedInConnected' might be a custom property on the Clerk user.user.publicMetadata or user.unsafeMetadata object.
    If it's not directly available, this line might need further adjustment based on your Clerk user object structure. 
    Example: !user?.publicMetadata?.linkedInConnected 
*/}
      {/* {user && !((user.publicMetadata as any)?.linkedInConnected) && <LinkedInWarning />} */}
      {/* The above line is commented out as linkedInConnected was part of the old Supabase auth. */}
      {/* LinkedIn integration will need to be re-evaluated with Clerk if still required. */}
      
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
