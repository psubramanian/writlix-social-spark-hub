export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'twitter';

export type PostStatus = 'scheduled' | 'posted' | 'failed' | 'draft';

export interface ScheduleSettings {
  id: string;
  userId: string;
  frequency: ScheduleFrequency;
  timeOfDay: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  isActive: boolean;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledPost {
  id: string;
  userId: string;
  contentId: string;
  title: string;
  content: string;
  platform: SocialPlatform;
  scheduledAt: Date;
  status: PostStatus;
  timezone: string;
  imageUrl?: string; // For Instagram posts
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialConnection {
  platform: SocialPlatform;
  isConnected: boolean;
  lastConnected?: Date;
  error?: string;
}

export interface PostGroup {
  key: string;
  label: string;
  posts: ScheduledPost[];
  isOverdue?: boolean;
}

// Component Props
export interface ScheduleSettingsProps {
  settings: ScheduleSettings | null;
  onSave: (settings: Partial<ScheduleSettings>) => Promise<void>;
  isLoading: boolean;
}

export interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  onPost: (postId: string, platform: SocialPlatform) => Promise<void>;
  onPreview: (post: ScheduledPost) => void;
  onDelete: (postId: string) => Promise<void>;
  socialConnections: SocialConnection[];
  isLoading: boolean;
}

export interface CalendarViewProps {
  posts: ScheduledPost[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPostSelect: (post: ScheduledPost) => void;
}

// Common timezone options
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
] as const;

// Platform specific configuration
export const PLATFORM_CONFIG = {
  linkedin: {
    name: 'LinkedIn',
    color: 'bg-blue-600',
    maxLength: 1300,
    requiresImage: false,
  },
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-500',
    maxLength: 63206,
    requiresImage: false,
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400',
    maxLength: 2200,
    requiresImage: true,
  },
  twitter: {
    name: 'X (Twitter)',
    color: 'bg-black',
    maxLength: 280,
    requiresImage: false,
  },
} as const;