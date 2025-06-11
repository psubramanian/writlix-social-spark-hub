# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status: AWS Migration

**⚠️ IMPORTANT: This project is currently undergoing migration from Supabase to AWS**

- **Current State**: Supabase-based architecture (legacy)
- **Target State**: AWS serverless architecture with Clerk authentication
- **Migration Timeline**: 21 days implementation
- **Budget**: $500 for migration + <$100/month operational costs

For detailed migration information, see:
- `project-docs/Technical_Implementation_Plan.md` - Complete technical roadmap
- `project-docs/Step_by_Step_Execution_Plan.md` - Day-by-day implementation guide
- `client-docs/AWS_Architecture_Overview.md` - Target architecture design

## Development Commands

```bash
# Install dependencies
npm i

# Start development server
npm run dev

# Build for production (will deploy to S3 + CloudFront)
npm run build

# Build for development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Current Architecture (Legacy Supabase)

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Radix UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions) *[TO BE MIGRATED]*
- **State Management**: React Query + Context API
- **Authentication**: Supabase Auth with OAuth *[MIGRATING TO CLERK]*
- **Routing**: React Router v6

## Target Architecture (AWS Migration)

### New Tech Stack
- **Frontend Hosting**: S3 Static Hosting + CloudFront CDN
- **Authentication**: Clerk (B2C + OAuth for Google, LinkedIn, Facebook, Instagram)
- **Backend**: AWS Lambda + API Gateway (serverless)
- **Database**: Amazon RDS PostgreSQL (optimized schema)
- **Storage**: S3 (AI images + assets)
- **Payments**: Stripe (replacing current Razorpay)
- **Monitoring**: CloudWatch
- **External APIs**: OpenAI, Social Media APIs, Google reCAPTCHA

### Core Architecture Patterns

**Authentication System:**
- Context-based auth (`src/contexts/auth/`) with modular structure
- Multi-layer route protection (Authentication → Profile → Subscription)
- Session recovery mechanisms with retry logic and localStorage backup
- Extended user model with profile completion tracking

**Social Media Integration:**
- Platform-specific credential storage (separate tables per platform)
- Dual posting approach: instant posting vs scheduled posting
- Supabase Edge Functions handle OAuth flows and API interactions
- Content generation via OpenAI GPT-4o-mini with image analysis

**Content Management:**
- Centralized content repository (`content_ideas` table)
- AI-powered content generation with structured prompts
- Rich text editing with HTML formatting and social previews
- CSV import for bulk content management

### Key Directories

- `src/contexts/auth/` - Authentication system implementation
- `src/hooks/` - Custom React hooks for data operations
- `src/components/ui/` - shadcn/ui components
- `src/pages/` - Main application pages
- `supabase/functions/` - Edge functions for backend operations
- `supabase/migrations/` - Database schema and updates

### Database Architecture

**Core Tables:**
- `content_ideas` - Central content repository with status tracking
- `scheduled_posts` - Links content to scheduling metadata
- `schedule_settings` - User scheduling preferences with timezone support
- Platform credentials tables: `user_facebook_credentials`, `user_linkedin_credentials`, `user_instagram_credentials`

### Social Media Operations

**OAuth Flow:**
1. Frontend components initiate OAuth (`*OAuth.tsx` files)
2. Edge functions handle token exchange and credential storage
3. Connection status tracked via `useSocialConnections` hook
4. Custom events broadcast connection changes

**Content Posting:**
- Instant posting: Direct API calls via `post-to-*-direct` functions
- Scheduled posting: Database entries processed by scheduling system
- Platform-specific preview components in `src/components/previews/`

### State Management Patterns

- React Query for server state and caching
- Context API for authentication and global state
- Custom hooks for data operations and business logic
- Optimistic updates with loading states and error handling

### Development Environment

- Path alias: `@/*` maps to `src/*`
- Development server runs on port 8080
- TypeScript with relaxed strictness for rapid development
- Extensive console logging for debugging auth and social operations

### Important Notes

- Authentication includes comprehensive recovery mechanisms - check console logs for debugging
- Social media credentials are stored separately per platform for security
- Edge functions handle all external API integrations
- Content generation uses structured AI prompts optimized for LinkedIn professional content
- Schedule settings support complex timing with timezone handling