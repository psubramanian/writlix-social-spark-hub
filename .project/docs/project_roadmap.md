# Project Roadmap: Next.js Migration 🚀

This roadmap outlines the key phases and tasks for migrating the Writlix Social Spark Hub to a unified Next.js application. It is based on `next-migration.md` (Version 0.1).

*Legend: 🚩 Phase Milestone, ➡️ Task, 💡 Note/Detail, ✅ Completed, 🚧 In Progress/Upcoming*

---

## 🚩 Phase 1: Next.js Project Initialization & Basic Frontend Setup 🏗️
*   [x] ➡️ **Initialize Next.js Project (`writlix-social-spark-hub`)**
    *   [x] 💡 Command: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
    *   [x] 💡 Confirm App Router, TypeScript, Tailwind CSS, ESLint during setup.
*   [ ] ➡️ **Install Additional Core Dependencies**
    *   [ ] 💡 `@clerk/nextjs`
    *   [x] 💡 `prisma`, `@prisma/client`, `pg` - *Installed as part of `prisma init` and general setup*
    *   [x] 💡 `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `tailwindcss-animate` (for shadcn/ui) - *Installed by `shadcn-ui init`*
    *   [ ] 💡 `@tanstack/react-query`, `react-hook-form`, `zod`, `next-themes`, `sonner`, `recharts`, `date-fns`, `date-fns-tz`.
*   [x] ➡️ **Basic Project Structure & Styling Configuration**
    *   [ ] 💡 Verify/Set up basic layout components (e.g., `src/app/layout.tsx`). - *Default layout exists, further customization pending*
    *   [x] 💡 Ensure `tailwind.config.ts` and `postcss.config.js` are correctly configured. Verify `src/app/globals.css`.
    *   [x] 💡 Initialize shadcn/ui: `npx shadcn-ui@latest init`.
*   [x] ➡️ **Migrate Static Assets**
    *   [x] 💡 Move relevant contents from old `frontend/public/` to Next.js `public/`.
*   [ ] ➡️ **Database Connection String Acquisition (via Temporary Vercel Project)**
    *   [ ] 💡 Objective: Obtain `DATABASE_URL` for "Prisma Postgres".
    *   [ ] 💡 Create a minimal, temporary Next.js app.
    *   [ ] 💡 Push to a temporary Git repository & create a Vercel project.
    *   [ ] 💡 Add "Prisma Postgres" integration to the temporary Vercel project.
    *   [ ] 💡 Copy and securely store the provisioned `DATABASE_URL`.
    *   [ ] 💡 Delete temporary resources.
*   [x] ➡️ **Prisma Setup in Main Project**
    *   [x] 💡 Initialize Prisma: `npx prisma init`.
    *   [x] 💡 Add `DATABASE_URL` to `.env.local`. - *Placeholder added to `.env`*
    *   [x] 💡 Define an initial Prisma schema (`prisma/schema.prisma`).
    *   [ ] 💡 Run `npx prisma db push` or `npx prisma migrate dev --name initial-setup`. - *Blocked: Needs DB URL*
*   [ ] ➡️ **Migrate Core React Components (Initial Pass - No Data)**
    *   [ ] 💡 Migrate simple, presentational components.
    *   [ ] 💡 Adapt import paths.
    *   [ ] 💡 Adapt client-side routing stubs using Next.js App Router.
*   [ ] ➡️ **Integrate Clerk Authentication (Frontend)**
    *   [ ] 💡 Set up Clerk provider (`<ClerkProvider>`) in `src/app/layout.tsx`.
    *   [ ] 💡 Implement sign-in, sign-up pages, and basic protected route concepts.

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
