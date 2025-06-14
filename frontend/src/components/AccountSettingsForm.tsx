import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';
import { Loader2 } from 'lucide-react';
import { profileOperations } from '@/utils/supabaseHelpers';

interface ProfileData {
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
}

export const AccountSettingsForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    email: '',
    first_name: '',
    last_name: '',
    mobile_number: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await profileOperations.fetchProfile(user.id);

      if (data && typeof data === 'object' &&
        'email' in data &&
        'first_name' in data &&
        'last_name' in data &&
        'mobile_number' in data
      ) {
        setFormData({
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          mobile_number: data.mobile_number || ''
        });
      } else {
        console.error('Invalid profile data:', data);
      }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await profileOperations.updateProfile(user.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        profile_completed: true
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your account settings have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter your first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter your last name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile_number">Mobile Number</Label>
            <Input
              id="mobile_number"
              value={formData.mobile_number}
              onChange={(e) => handleInputChange('mobile_number', e.target.value)}
              placeholder="Enter your mobile number"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
