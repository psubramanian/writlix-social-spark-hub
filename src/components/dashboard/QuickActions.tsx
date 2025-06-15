import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Calendar, Settings } from 'lucide-react';

export function QuickActions() {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>Quick actions to manage your content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Link href="/content" className="block">
            <Button variant="outline" className="w-full justify-start">
              <Upload className="mr-2 h-4 w-4" />
              Create new content
            </Button>
          </Link>
          
          <Link href="/schedule" className="block">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule your content
            </Button>
          </Link>
          
          <Link href="/settings" className="block">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Configure account settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}