
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Linkedin, Facebook, Instagram } from "lucide-react";
import LinkedInPreview from './previews/LinkedInPreview';
import FacebookPreview from './previews/FacebookPreview';
import InstagramPreview from './previews/InstagramPreview';
import { useSocialPreview } from '../hooks/useSocialPreview';

interface SocialMediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  imageUrl?: string;
  selectedPlatforms: string[];
  onPostToLinkedIn: () => void;
  onPostToFacebook: () => void;
  onPostToInstagram: () => void;
  isPosting: boolean;
  postingPlatform: string | null;
}

const SocialMediaPreviewDialog: React.FC<SocialMediaPreviewDialogProps> = ({
  open,
  onOpenChange,
  content,
  imageUrl,
  selectedPlatforms,
  onPostToLinkedIn,
  onPostToFacebook,
  onPostToInstagram,
  isPosting,
  postingPlatform
}) => {
  const { profiles, loading } = useSocialPreview();

  if (!content.trim()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview & Post</DialogTitle>
          <DialogDescription>
            Preview how your content will look on each platform before posting
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {selectedPlatforms.includes('linkedin') && (
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
            )}
            {selectedPlatforms.includes('facebook') && (
              <TabsTrigger value="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </TabsTrigger>
            )}
            {selectedPlatforms.includes('instagram') && (
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </TabsTrigger>
            )}
          </TabsList>

          {selectedPlatforms.includes('linkedin') && (
            <TabsContent value="linkedin" className="mt-6">
              <LinkedInPreview
                content={content}
                imageUrl={imageUrl}
                userProfile={profiles.linkedin}
                onPost={onPostToLinkedIn}
                isPosting={isPosting && postingPlatform === 'linkedin'}
              />
            </TabsContent>
          )}

          {selectedPlatforms.includes('facebook') && (
            <TabsContent value="facebook" className="mt-6">
              <FacebookPreview
                content={content}
                imageUrl={imageUrl}
                userProfile={profiles.facebook}
                onPost={onPostToFacebook}
                isPosting={isPosting && postingPlatform === 'facebook'}
              />
            </TabsContent>
          )}

          {selectedPlatforms.includes('instagram') && (
            <TabsContent value="instagram" className="mt-6">
              <InstagramPreview
                content={content}
                imageUrl={imageUrl}
                userProfile={profiles.instagram}
                onPost={onPostToInstagram}
                isPosting={isPosting && postingPlatform === 'instagram'}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SocialMediaPreviewDialog;
