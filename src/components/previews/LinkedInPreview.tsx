
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2, Send } from 'lucide-react';

interface LinkedInPreviewProps {
  content: string;
  imageUrl?: string;
  userProfile?: {
    name: string;
    profilePicture?: string;
    headline?: string;
  };
  onPost: () => void;
  isPosting: boolean;
}

const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({
  content,
  imageUrl,
  userProfile,
  onPost,
  isPosting
}) => {
  const defaultProfile = {
    name: userProfile?.name || 'Your Name',
    profilePicture: userProfile?.profilePicture,
    headline: userProfile?.headline || 'Professional Title'
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-gray-200 bg-white">
        {/* LinkedIn Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {defaultProfile.profilePicture ? (
              <img 
                src={defaultProfile.profilePicture} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              defaultProfile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{defaultProfile.name}</div>
            <div className="text-sm text-gray-600">{defaultProfile.headline}</div>
            <div className="text-xs text-gray-500">Just now</div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <div 
            className="text-gray-900 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content.replace(/<[^>]*>/g, '') }}
          />
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="mb-4">
            <img 
              src={imageUrl} 
              alt="Post image" 
              className="w-full rounded-lg max-h-80 object-cover"
            />
          </div>
        )}

        {/* LinkedIn Engagement Bar */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 hover:text-blue-600">
                <ThumbsUp className="w-4 h-4" />
                <span>Like</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-600">
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-600">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-600">
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Button 
        onClick={onPost} 
        disabled={isPosting}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isPosting ? 'Posting to LinkedIn...' : 'Post to LinkedIn'}
      </Button>
    </div>
  );
};

export default LinkedInPreview;
