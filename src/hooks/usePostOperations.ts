
import { usePostContent } from './usePostContent';
import { useSocialPosting } from './useSocialPosting';

export function usePostOperations() {
  const { savePostContent, regenerateContent, isRegenerating } = usePostContent();
  const { postToLinkedIn, postToFacebook, postToInstagram } = useSocialPosting();

  return { 
    savePostContent,
    regenerateContent,
    isRegenerating,
    postToLinkedIn,
    postToFacebook,
    postToInstagram
  };
}
