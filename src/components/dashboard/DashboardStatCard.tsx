
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
}

export function DashboardStatCard({ title, value, isLoading = false }: DashboardStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {isLoading ? '...' : value}
        </div>
      </CardContent>
    </Card>
  );
}
