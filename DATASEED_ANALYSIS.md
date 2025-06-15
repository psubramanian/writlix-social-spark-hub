# DataSeed Feature Analysis & Database Requirements

## Legacy Investigation Results

### Button Functions from Legacy Code

Based on investigation of `/legacy_files_backup/.0-frontend-reference/src/components/data-seed/ContentTable.tsx`:

#### 1. **Status Badge (Review/Scheduled)**
- **Purpose**: Toggles content status between states
- **Behavior**: 
  - `Review` (yellow) → Click → `Scheduled` (green)
  - `Scheduled` (green) → Click → `Review` (yellow)
  - `Published` content is filtered out (not shown in main table)
- **Function**: `onStatusToggle(id: string)`

#### 2. **Preview Button (Eye/Maximize2 Icon)**
- **Purpose**: Opens content in full preview/edit dialog
- **Behavior**: 
  - Opens `ContentSocialPreviewDialog` modal
  - Shows multi-platform preview (LinkedIn, Facebook, Instagram)
  - Allows content editing with rich text editor
  - Provides platform-specific formatting guidance
- **Function**: `onPreview(content: ContentItem)`

#### 3. **Delete Button (Trash Icon)**
- **Purpose**: Permanently removes content item
- **Behavior**: Deletes content from database and local state
- **Function**: `onDelete(id: string)`

### Content Preview Dialog Features

From `/legacy_files_backup/.0-frontend-reference/src/components/social-preview/ContentSocialPreviewDialog.tsx`:

#### Multi-Platform Preview
- **LinkedIn**: Professional post format with character limits
- **Facebook**: Social media post with engagement optimization
- **Instagram**: Caption format with character limits and visual focus

#### Content Editing
- **Rich Text Editor**: Full HTML editing capabilities
- **Real-time Preview**: Shows how content looks on each platform
- **Platform Guidelines**: 
  - LinkedIn: Under 1,300 characters for optimal engagement
  - Facebook: Under 80 characters get 66% more engagement
  - Instagram: 2,200 character limit, first 125 shown without "more"

#### Content Management
- **Edit Mode**: Toggle between preview and edit
- **Regenerate**: AI regeneration of content (RefreshCw icon)
- **Save Changes**: Update content in database
- **Status Restrictions**: Published content is read-only

## Database Schema Requirements

### Current Prisma Schema Analysis

From `/prisma/schema.prisma`, we have a robust database structure:

#### Core Models Needed for DataSeed:

```typescript
model ContentIdea {
  id              String            @id @default(cuid())
  userId          String            // Clerk User ID
  textContent     String            @db.Text
  mediaReferences String[]          // URLs to images/videos
  status          ContentIdeaStatus @default(DRAFT)
  sourcePrompt    String?           @db.Text // Original AI prompt
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  user           User            @relation(fields: [userId], references: [id])
  scheduledPosts ScheduledPost[]
}

enum ContentIdeaStatus {
  DRAFT      // Initial generation state
  APPROVED   // Ready for scheduling (our "Review")
  SCHEDULED  // Queued for posting (our "Scheduled") 
  PUBLISHED  // Posted to social media
  FAILED     // Failed to post
  ARCHIVED   // Soft deleted
}
```

### Migration Plan: Legacy to Current Types

#### Current Implementation Gap:
Our current `ContentItem` type uses simplified statuses:
```typescript
// Current (simplified)
status: 'Review' | 'Scheduled' | 'Published'

// Should map to Prisma schema:
status: ContentIdeaStatus // DRAFT | APPROVED | SCHEDULED | PUBLISHED | FAILED | ARCHIVED
```

#### Mapping Strategy:
- `Review` → `APPROVED` (ready for user review and scheduling)
- `Scheduled` → `SCHEDULED` (queued for posting)
- `Published` → `PUBLISHED` (posted to social media)

### Required Database Operations

#### For DataSeed Page:
1. **Content Generation**:
   ```sql
   INSERT INTO ContentIdea (userId, textContent, status, sourcePrompt)
   VALUES (?, ?, 'DRAFT', ?)
   ```

2. **Status Toggle**:
   ```sql
   UPDATE ContentIdea 
   SET status = CASE 
     WHEN status = 'APPROVED' THEN 'SCHEDULED'
     WHEN status = 'SCHEDULED' THEN 'APPROVED'
   END
   WHERE id = ? AND userId = ?
   ```

3. **Content Deletion**:
   ```sql
   DELETE FROM ContentIdea WHERE id = ? AND userId = ?
   -- OR soft delete:
   UPDATE ContentIdea SET status = 'ARCHIVED' WHERE id = ? AND userId = ?
   ```

4. **Content Update**:
   ```sql
   UPDATE ContentIdea 
   SET textContent = ?, updatedAt = NOW()
   WHERE id = ? AND userId = ?
   ```

### Additional Features to Implement

#### 1. **Content Preview Dialog**
- Multi-platform preview (LinkedIn, Facebook, Instagram, X)
- Rich text editing with HTML support
- Platform-specific character count and guidelines
- AI regeneration capability

#### 2. **CSV Import**
- File upload handling
- CSV parsing (title, preview, content columns)
- Bulk insert into ContentIdea table
- Error handling for malformed data

#### 3. **AI Integration**
- OpenAI API integration for content generation
- Prompt storage for regeneration
- Content variation generation
- Platform-specific optimization

## Implementation Priority

### Phase 1 (Current - Completed):
✅ DataSeed page layout and styling
✅ GenerationForm component
✅ ContentTable component with basic functionality
✅ Mock content generation

### Phase 2 (Next):
- [ ] Content preview dialog with multi-platform support
- [ ] Database integration with Prisma
- [ ] Real AI content generation API
- [ ] CSV import functionality

### Phase 3 (Future):
- [ ] Rich text editor integration
- [ ] Platform-specific content optimization
- [ ] Content scheduling integration
- [ ] Analytics and performance tracking

## Technical Notes

### Content Storage:
- **HTML Support**: Content stored as HTML for rich formatting
- **Media References**: Separate array for image/video URLs
- **Source Tracking**: Original AI prompt stored for regeneration
- **Multi-Platform**: Same content optimized for different platforms

### Security Considerations:
- **User Isolation**: All queries filtered by userId (Clerk)
- **Content Sanitization**: HTML content should be sanitized
- **Rate Limiting**: AI generation should be rate limited
- **File Upload**: CSV uploads need validation and virus scanning

### Performance Optimizations:
- **Pagination**: Implemented (10 items per page)
- **Filtering**: Published content excluded from main view
- **Indexing**: Database indices on userId, status, createdAt
- **Caching**: AI responses could be cached for similar prompts