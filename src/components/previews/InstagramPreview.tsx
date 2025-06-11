
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

interface InstagramPreviewProps {
  content: string;
  imageUrl?: string;
  userProfile?: {
    name: string;
    profilePicture?: string;
    username?: string;
  };
  onPost: () => void;
  isPosting: boolean;
}

const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  content,
  imageUrl,
  userProfile,
  onPost,
  isPosting
}) => {
  const defaultProfile = {
    name: userProfile?.name || 'Your Name',
    username: userProfile?.username || 'yourusername',
    profilePicture: userProfile?.profilePicture
  };

  return (
    <div className="space-y-4">
      <Card className="p-0 border border-gray-200 bg-white max-w-md mx-auto">
        {/* Instagram Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                {defaultProfile.profilePicture ? (
                  <img 
                    src={defaultProfile.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                    {defaultProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm">{defaultProfile.username}</div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div className="aspect-square bg-gray-100">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Post image" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-sm">No image provided</div>
              </div>
            </div>
          )}
        </div>

        {/* Instagram Actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button className="hover:text-gray-600">
                <Heart className="w-6 h-6" />
              </button>
              <button className="hover:text-gray-600">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="hover:text-gray-600">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <button className="hover:text-gray-600">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>

          <div className="text-sm font-semibold mb-1">0 likes</div>
          
          {/* Caption */}
          <div className="text-sm">
            <span className="font-semibold mr-2">{defaultProfile.username}</span>
            <span 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: content.replace(/<[^>]*>/g, '') }}
            />
          </div>
          
          <div className="text-xs text-gray-500 mt-2">JUST NOW</div>
        </div>
      </Card>

      <Button 
        onClick={onPost} 
        disabled={isPosting}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isPosting ? 'Posting to Instagram...' : 'Post to Instagram'}
      </Button>
    </div>
  );
};

export default InstagramPreview;
