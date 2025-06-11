
import { useContentRegeneration } from './useContentRegeneration';
import { useContentUpdate } from './useContentUpdate';
import { useContentDeletion } from './useContentDeletion';
import type { ContentItem } from '@/types/content';

export const useContentOperations = (setGeneratedContent: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
  const { regenerateContent } = useContentRegeneration(setGeneratedContent);
  const { updateContent } = useContentUpdate(setGeneratedContent);
  const { deleteContent } = useContentDeletion(setGeneratedContent);

  return {
    regenerateContent,
    updateContent,
    deleteContent
  };
};
