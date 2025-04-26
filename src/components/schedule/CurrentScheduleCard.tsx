
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { ScheduleSettings } from '@/types/schedule';

interface CurrentScheduleCardProps {
  settings: ScheduleSettings | null;
}

export function CurrentScheduleCard({ settings }: CurrentScheduleCardProps) {
  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return settings?.dayOfWeek !== undefined ? 
        `Weekly on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][settings.dayOfWeek]}` : 
        'Weekly';
      case 'monthly': return settings?.dayOfMonth !== undefined ? 
        `Monthly on day ${settings.dayOfMonth}` :
        'Monthly';
      default: return frequency;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Current Schedule
        </CardTitle>
        <CardDescription>
          Your default posting schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settings ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Frequency:</span>
              <Badge variant="outline">{getFrequencyDisplay(settings.frequency)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Time:</span>
              <Badge variant="outline">{settings.timeOfDay}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Timezone:</span>
              <Badge variant="outline">{settings.timezone}</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">Loading your schedule...</div>
        )}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Change your schedule below to update all scheduled posts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
