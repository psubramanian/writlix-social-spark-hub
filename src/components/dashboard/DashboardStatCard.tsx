import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
}

export function DashboardStatCard({ title, value, isLoading = false }: DashboardStatCardProps) {
  return (
    <Card className="bg-gradient-to-br from-white to-purple-50/50 border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          {isLoading ? (
            <div className="w-16 h-8 bg-gradient-to-r from-purple-200 to-blue-200 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}