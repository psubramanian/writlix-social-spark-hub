# Project Roadmap: WritLix Social Spark Hub 🚀

Multi-platform social media content management and generation platform built with Next.js.

*Legend: 🚩 Phase Milestone, ➡️ Task, 💡 Note/Detail, ✅ Completed, 🚧 In Progress*

---

## 🚩 Phase 1: Foundation & Core Setup ✅ COMPLETED

### Authentication & Layout System
*   [x] ➡️ **Next.js Project Initialization**
    *   [x] 💡 App Router with TypeScript, Tailwind CSS v4, ESLint
    *   [x] 💡 shadcn/ui component library integration
*   [x] ➡️ **Clerk Authentication Integration**
    *   [x] 💡 Complete login/logout flow with styled components
    *   [x] 💡 Route protection with middleware
    *   [x] 💡 User management with custom styled modals
*   [x] ➡️ **Professional Layout System**
    *   [x] 💡 Sidebar navigation with gradient styling
    *   [x] 💡 Top bar with user controls
    *   [x] 💡 Responsive design with glassmorphism effects
*   [x] ➡️ **Database Schema Definition**
    *   [x] 💡 Complete Prisma schema with ContentIdea, User, ScheduledPost models
    *   [x] 💡 Multi-platform support architecture

### Core Page Implementation  
*   [x] ➡️ **Dashboard Page**
    *   [x] 💡 Statistics cards with gradient styling
    *   [x] 💡 Quick actions component
    *   [x] 💡 Upcoming posts preview
*   [x] ➡️ **DataSeed Page (Content Generation)**
    *   [x] 💡 GenerationForm with topic input and quantity slider
    *   [x] 💡 ContentTable with pagination and status management
    *   [x] 💡 Mock AI content generation (3-second delay)
    *   [x] 💡 Status toggle functionality (Review ↔ Scheduled)

## 🚩 Phase 2: Database Integration & Real Data 🚧 IN PROGRESS

### Database Connection
*   [ ] ➡️ **PostgreSQL Database Setup**
    *   [ ] 💡 Database URL configuration (Supabase/Railway/Neon)
    *   [ ] 💡 Initial migration with Prisma
*   [ ] ➡️ **Content CRUD Operations**
    *   [ ] 💡 Replace mock data with real Prisma operations
    *   [ ] 💡 User isolation with Clerk userId filtering
    *   [ ] 💡 Error handling for database failures

### AI Integration
*   [ ] ➡️ **OpenAI API Integration**
    *   [ ] 💡 Replace mock generation with real AI calls
    *   [ ] 💡 Content regeneration capability
    *   [ ] 💡 Rate limiting and usage tracking

### Enhanced UI Components
*   [ ] ➡️ **Content Preview Dialog**
    *   [ ] 💡 Multi-platform preview (LinkedIn, Facebook, Instagram)
    *   [ ] 💡 Rich text editing with HTML support
    *   [ ] 💡 Platform-specific formatting guidelines

## 🚩 Phase 2: Backend API Migration (API Routes) ⚙️
*   [ ] ➡️ **Migrate Express Endpoints to Next.js API Routes**
    *   [ ] 💡 For each route in `api-handler/app.js`, create a corresponding `app/api/.../route.ts`.
    *   [ ] 💡 Rewrite request handling logic.
    *   [ ] 💡 Replace database calls with Prisma Client operations.
    *   [ ] 💡 Integrate Clerk for backend authentication.
*   [ ] ➡️ **Environment Variables**
    *   [ ] 💡 Ensure all backend environment variables (Clerk keys, database URL, etc.) are in `.env.local`.

## 🚩 Phase 3: Connecting Frontend to New API & Full Integration 🔗
*   [ ] ➡️ **Update Frontend Data Fetching**
    *   [ ] 💡 Modify React components and custom hooks to call new Next.js API routes.
    *   [ ] 💡 Refactor data fetching logic, leveraging Next.js Server Components where appropriate.
    *   [ ] 💡 `@tanstack/react-query` for client-side server state.
    *   [ ] 💡 Migrate forms using `react-hook-form` and `zod`.
*   [ ] ➡️ **End-to-End Testing**
    *   [ ] 💡 Thoroughly test all features: authentication, CRUD operations, scheduling, etc.
*   [ ] ➡️ **Styling Adjustments**
    *   [ ] 💡 Address any styling issues arising from the migration.
*   [ ] ➡️ **Code Cleanup**
    *   [ ] 💡 Remove old Express backend code.
    *   [ ] 💡 Remove old React project setup files.

## 🚩 Phase 4: Build, Deployment & Platform Evaluation 🚀☁️
*   [ ] ➡️ **Local Build & Test**
    *   [ ] 💡 Ensure `next build` and `next start` work correctly.
*   [ ] ➡️ **Deployment Platform Finalization**
    *   [ ] 💡 Confirm Vercel as the deployment platform.
*   [ ] ➡️ **Database Platform Selection (for Vercel Deployment)**
    *   [ ] 💡 Primary Target: Prisma Postgres.
    *   [ ] 💡 Secondary Target: Neon.
    *   [ ] 💡 Tertiary Target: Supabase (Postgres backend).
*   [ ] ➡️ **Object Storage Implementation**
    *   [ ] 💡 Integrate Vercel Blob for user-generated image storage.
*   [ ] ➡️ **Deployment**
    *   [ ] 💡 Configure Vercel project settings and environment variables for production.
    *   [ ] 💡 API routes as Vercel Serverless Functions (Node.js runtime).
    *   [ ] 💡 Deploy and thoroughly test in the Vercel environment.

## 💡 Open Questions & Considerations (from next-migration.md)
*   [ ] Complexity of existing Express middleware (to be assessed during backend migration).
*   [ ] Specific data models for Prisma schema (to be defined based on backend logic and features).
*   [ ] Detailed plan for migrating existing data (if any) to PostgreSQL (TBD).
*   [ ] Testing strategy for each migration phase (to be detailed).

---
*Last updated: 2025-06-15. Based on `next-migration.md` (Version 0.1).*

## Q2-2025 Overview

*(Define goals, milestones for the current/next quarter)*
