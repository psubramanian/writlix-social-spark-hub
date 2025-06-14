
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, User, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react'; // Replaced useAuth with Clerk's useUser

interface LinkedInPage {
  id: string;
  page_type: 'personal' | 'company';
  page_id: string;
  page_name: string;
  page_data: any;
  is_selected: boolean;
}

interface LinkedInPageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const LinkedInPageSelector = ({ isOpen, onClose, onSave }: LinkedInPageSelectorProps) => {
  const [pages, setPages] = useState<LinkedInPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  // Defer operations until user is loaded, especially for useEffect dependencies
  // The existing useEffect for fetchPages already depends on user?.id and isOpen.
  // We need to ensure that `isLoaded` is also considered or that `user` is stable.
  // The component only renders if isOpen is true, so loading state inside the modal is appropriate.

  useEffect(() => {
    if (isOpen && isLoaded && user?.id) { // Ensure user is loaded before fetching
      setLoading(true);
      fetchPages();
    } else if (isOpen && isLoaded && !user?.id) {
      // User is loaded but not available (e.g., logged out while modal was open or about to open)
      setLoading(false);
      setPages([]); // Clear pages if no user
      toast({
        title: "Authentication Error",
        description: "User not found. Please log in.",
        variant: "destructive",
      });
    }
    // If !isLoaded yet, the fetchPages will be triggered by this effect once isLoaded becomes true.
  }, [isOpen, user?.id, isLoaded]); // Added isLoaded to dependency array

  // Original useEffect for fetchPages is removed as its logic is merged above.
  // useEffect(() => {
  //   if (isOpen) {
  //     setLoading(true);
  //     fetchPages();
  //   }
  // }, [isOpen, user?.id]);


  const fetchPages = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_linkedin_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('page_type', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedPages: LinkedInPage[] = (data || []).map(page => ({
        id: page.id,
        page_type: page.page_type as 'personal' | 'company',
        page_id: page.page_id,
        page_name: page.page_name,
        page_data: page.page_data,
        is_selected: page.is_selected || false
      }));

      setPages(transformedPages);
    } catch (error) {
      console.error('Error fetching LinkedIn pages:', error);
      toast({
        title: "Error",
        description: "Failed to load LinkedIn pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchPages();
    }
  }, [isOpen, user?.id]);

  const handlePageToggle = (pageId: string, checked: boolean) => {
    setPages(prev => 
      prev.map(page => 
        page.id === pageId ? { ...page, is_selected: checked } : page
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update all pages with their new selection status
      for (const page of pages) {
        const { error } = await supabase
          .from('user_linkedin_pages')
          .update({ 
            is_selected: page.is_selected,
            updated_at: new Date().toISOString()
          })
          .eq('id', page.id);

        if (error) throw error;
      }

      toast({
        title: "Pages Updated",
        description: "Your LinkedIn page selection has been saved",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving page selection:', error);
      toast({
        title: "Error",
        description: "Failed to save page selection",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </div>
            Select LinkedIn Pages
          </CardTitle>
          <CardDescription>
            Choose which LinkedIn accounts you want to post content to. You can change this selection anytime.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading your LinkedIn pages...</span>
            </div>
          ) : pages.length === 0 ? (
            <Alert>
              <AlertDescription>
                No LinkedIn pages found. Please try reconnecting your account.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    id={page.id}
                    checked={page.is_selected}
                    onCheckedChange={(checked) => handlePageToggle(page.id, !!checked)}
                  />
                  
                  <div className="flex-shrink-0">
                    {page.page_type === 'personal' ? (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <label
                      htmlFor={page.id}
                      className="block text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {page.page_name}
                    </label>
                    <p className="text-xs text-gray-500 capitalize">
                      {page.page_type === 'personal' ? 'Personal Profile' : 'Company Page'}
                    </p>
                  </div>
                  
                  {page.is_selected && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || pages.length === 0}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Selection'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInPageSelector;
