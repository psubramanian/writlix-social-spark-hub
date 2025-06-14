
import { usePostContent } from './usePostContent';
import { useSocialPosting } from './useSocialPosting';

export function usePostOperations(userId: string | undefined) {
  const { savePostContent, regenerateContent, isRegenerating } = usePostContent(userId);
  const { postToLinkedIn, postToFacebook, postToInstagram } = useSocialPosting(userId);

  return { 
    savePostContent,
    regenerateContent,
    isRegenerating,
    postToLinkedIn,
    postToFacebook,
    postToInstagram
  };
}
