
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface FacebookPreviewProps {
  content: string;
  imageUrl?: string;
  userProfile?: {
    name: string;
    profilePicture?: string;
  };
  onPost: () => void;
  isPosting: boolean;
}

const FacebookPreview: React.FC<FacebookPreviewProps> = ({
  content,
  imageUrl,
  userProfile,
  onPost,
  isPosting
}) => {
  const defaultProfile = {
    name: userProfile?.name || 'Your Name',
    profilePicture: userProfile?.profilePicture
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-gray-200 bg-white">
        {/* Facebook Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {defaultProfile.profilePicture ? (
                <img 
                  src={defaultProfile.profilePicture} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                defaultProfile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{defaultProfile.name}</div>
              <div className="text-xs text-gray-500">Just now • 🌍</div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
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
          <div className="mb-4 -mx-4">
            <img 
              src={imageUrl} 
              alt="Post image" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Facebook Engagement */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">👍</div>
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs -ml-1">❤️</div>
              </div>
              <span>0</span>
            </div>
            <div className="text-sm text-gray-600">0 comments • 0 shares</div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md flex-1 justify-center">
              <ThumbsUp className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">Like</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md flex-1 justify-center">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">Comment</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md flex-1 justify-center">
              <Share2 className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">Share</span>
            </button>
          </div>
        </div>
      </Card>

      <Button 
        onClick={onPost} 
        disabled={isPosting}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isPosting ? 'Posting to Facebook...' : 'Post to Facebook'}
      </Button>
    </div>
  );
};

export default FacebookPreview;
