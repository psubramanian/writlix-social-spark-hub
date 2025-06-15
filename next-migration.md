# Next.js Migration Plan for writlix-social-spark-hub

**Version:** 0.1
**Date:** 2025-06-15

## 1. Goals

*   Migrate the existing React frontend and Express.js backend into a unified Next.js application.
*   Maintain existing styling and core UI/UX.
*   Continue using Clerk for authentication.
*   Complete the transition from Supabase (and any remnants of DynamoDB) to PostgreSQL as the primary database.
*   Prepare the application for deployment on a modern PaaS platform (e.g., Vercel, Railway, Netlify) with a compatible PostgreSQL provider (e.g., Neon, Railway Postgres, Aiven).

## 2. Current Stack Overview

*   **Frontend Framework/Build:** Vite + React + TypeScript
*   **Styling:** Tailwind CSS with shadcn/ui (built on Radix UI primitives). Uses `tailwind.config.ts`, `postcss.config.js`, and `components.json`.
*   **Routing:** `react-router-dom` for client-side navigation.
*   **State Management (Server-Side Focus):** `@tanstack/react-query` for data fetching, caching, and mutations.
*   **State Management (Client-Side Focus):** Likely React Context and local component state (no dedicated global state library like Redux/Zustand identified).
*   **Forms:** `react-hook-form` with `zod` for validation.
*   **Authentication (Frontend):** `@clerk/clerk-react`.
*   **Backend (Original):** Express.js (`api-handler/app.js`)
*   **Database (Original Target):** PostgreSQL

## 3. Proposed Next.js Stack

*   **Framework:** Next.js (using App Router)
*   **Authentication:** Clerk (using `@clerk/nextjs`)
*   **Database ORM:** Prisma
*   **Database:** PostgreSQL. For local development, a cloud-hosted instance (e.g., 'Prisma Postgres' via Vercel marketplace or Neon) will be used to align closely with the production setup. Production will use a managed service like Prisma Postgres or Neon.
*   **Styling:** Retain Tailwind CSS & shadcn/ui. Configure Tailwind in Next.js. shadcn/ui components are expected to migrate smoothly.
*   **Deployment Platform:** Vercel
*   **Object Storage:** Vercel Blob

## 4. Migration Phases

### Phase 1: Next.js Project Initialization & Basic Frontend Setup

1.  **Initialize Next.js Project (`writlix-social-spark-hub`):**
    *   In the root of the `writlix-social-spark-hub` repository, create the Next.js application.
    *   Command: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (using `.` to initialize in current dir, adjust flags as preferred, e.g., skip `--src-dir` if `pages` or `app` directly in root is okay).
    *   Confirm App Router, TypeScript, Tailwind CSS, ESLint during setup.
2.  **Install Additional Core Dependencies:**
    *   `@clerk/nextjs`
    *   `prisma`, `@prisma/client`, `pg` (Prisma will be configured in a later step)
    *   `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `tailwindcss-animate` (for shadcn/ui, if not already added by `create-next-app`'s Tailwind setup).
    *   `@tanstack/react-query`, `react-hook-form`, `zod`, `next-themes`, `sonner`, `recharts`, `date-fns`, `date-fns-tz`.
3.  **Basic Project Structure & Styling Configuration:**
    *   Verify/Set up basic layout components in Next.js (e.g., `src/app/layout.tsx`).
    *   Ensure `tailwind.config.ts` and `postcss.config.js` are correctly configured for Tailwind CSS. Verify `src/app/globals.css`.
    *   Initialize shadcn/ui if desired: `npx shadcn-ui@latest init`. This will create `components.json` and set up necessary configurations.
4.  **Migrate Static Assets:**
    *   Move relevant contents from the old `frontend/public/` folder to the Next.js `public/` folder (root level).
5.  **Database Connection String Acquisition (via Temporary Vercel Project):**
    *   **Objective:** Obtain `DATABASE_URL` for "Prisma Postgres" (1GB free tier) to be used for development, ensuring client can later have integrated billing via Vercel.
    *   Create a minimal, temporary Next.js app in a separate directory/Git repo.
    *   Push this temporary app to a new temporary Git repository.
    *   Create a Vercel project from this temporary Git repo.
    *   Add the "Prisma Postgres" integration via the Vercel marketplace to this temporary Vercel project.
    *   Copy the provisioned `DATABASE_URL` (and other relevant `POSTGRES_*` URLs) from the temporary Vercel project's environment variables.
    *   Store these URLs securely (e.g., in your password manager) for use in the main `writlix-social-spark-hub` project.
    *   The temporary Git repo and Vercel project can be deleted after obtaining the URLs.
6.  **Prisma Setup in Main Project:**
    *   In the `writlix-social-spark-hub` Next.js project, initialize Prisma: `npx prisma init` (if not already partially done by `create-next-app` or if a fresh setup is preferred).
    *   Create `.env.local` and add the `DATABASE_URL` (and other relevant URLs like `POSTGRES_URL_NONPOOLING` if provided/needed for migrations) obtained in the previous step.
    *   Define an initial Prisma schema (`prisma/schema.prisma`) e.g., for users, posts.
    *   Run `npx prisma db push` or `npx prisma migrate dev --name initial-setup` to apply the schema to the cloud-hosted development database.
7.  **Migrate Core React Components (Initial Pass - No Data):**
    *   Start migrating simple, presentational components from `frontend/src/components` to `writlix-social-spark-hub/src/components` (or your chosen Next.js structure).
    *   Adapt import paths. Focus on getting components to render without live data initially.
    *   Adapt client-side routing stubs using Next.js App Router conventions (folder-based routing in `src/app`).
8.  **Integrate Clerk Authentication (Frontend):**
    *   Set up Clerk provider (`<ClerkProvider>`) in `src/app/layout.tsx`.
    *   Implement sign-in, sign-up pages, and basic protected route concepts using Next.js middleware or page-level checks with Clerk hooks.

### Phase 2: Backend API Migration (API Routes)

1.  **Migrate Express Endpoints to Next.js API Routes:**
    *   For each route in `api-handler/app.js`:
        *   Create a corresponding file in `app/api/.../route.ts` (App Router) or `pages/api/...ts` (Pages Router).
        *   Rewrite request handling logic.
        *   Replace database calls with Prisma Client operations.
        *   Integrate Clerk for backend authentication (`getAuth` from `@clerk/nextjs/api` or middleware).
2.  **Environment Variables:**
    *   Ensure all backend environment variables (Clerk keys, database URL, etc.) are in `.env.local`.

### Phase 3: Connecting Frontend to New API & Full Integration

1.  **Update Frontend Data Fetching:**
    *   Modify React components and custom hooks (`useSocialPosting.ts`, etc.) to call the new Next.js API routes.
    *   Refactor data fetching logic. For initial page data, leverage Next.js Server Components and server-side data fetching capabilities. `@tanstack/react-query` can continue to be used for client-side mutations, optimistic updates, and other complex client-side server state management.
    *   Migrate forms using `react-hook-form` and `zod` (expected to be straightforward).
2.  **End-to-End Testing:**
    *   Thoroughly test all features: authentication, CRUD operations for posts, scheduling, etc.
3.  **Styling Adjustments:**
    *   Address any styling issues arising from the migration.
4.  **Code Cleanup:**
    *   Remove old Express backend code (`api-handler/`).
    *   Remove old React project setup files if Next.js is now at the root.

### Phase 4: Build, Deployment & Platform Evaluation

1.  **Local Build & Test:**
    *   Ensure `next build` and `next start` work correctly.
2.  **Deployment Platform Finalization:**
    *   Confirm Vercel as the deployment platform. Ensure Vercel project is linked to the Git repository.
3.  **Database Platform Selection (for Vercel Deployment):**
    *   **Primary Target: Prisma Postgres.** As seen in the Vercel marketplace, this option is directly available for creation, offering an "Edge-ready, w/o Cold Starts" experience, likely optimized for Prisma users on Vercel.
    *   **Secondary Target: Neon.** A strong serverless Postgres provider that integrates well with Vercel. Connection would be via a standard connection string obtained from Neon's dashboard.
    *   **Tertiary Target: Supabase (Postgres backend).** Also available for direct creation in the Vercel marketplace if only its Postgres database is needed.
4.  **Object Storage Implementation:**
    *   Integrate **Vercel Blob** for user-generated image storage. API routes will handle secure upload logic, utilizing the `@vercel/blob` SDK.
5.  **Deployment:**
    *   Configure Vercel project settings and environment variables for production (Clerk keys, `DATABASE_URL` for the chosen Postgres provider like Prisma Postgres or Neon, Vercel Blob store ID).
    *   API routes will be deployed as Vercel Serverless Functions (Node.js runtime) to ensure full compatibility with Prisma and standard Node.js libraries. This avoids the need for Edge-specific database drivers.
    *   Deploy and thoroughly test all functionalities in the Vercel environment.

## 5. Open Questions & Considerations (Now Mostly Addressed or Noted)

*   ~~Styling solution in use?~~ **Answered:** Tailwind CSS with shadcn/ui.
*   ~~Current state of React components (class vs. functional, context/state management).~~ **Answered:** Assumed functional components with hooks (typical for Vite/React/TS). State via `@tanstack/react-query`, React Context, and local state.
*   Complexity of existing Express middleware (to be assessed during backend migration).
*   Specific data models for Prisma schema (to be defined based on backend logic and features).
*   Detailed plan for migrating existing data (if any) to PostgreSQL (TBD, depends on if there's production data to move).
*   Testing strategy for each migration phase (to be detailed).

## 6. Project Structure & Naming Conventions

This structure is designed for clarity, scalability, and alignment with Next.js (App Router) best practices and Windsurf global rules. It emphasizes breaking down logic into smaller, reusable functions and modules to keep individual files concise and maintainable, adhering to the principle of single-responsibility.

```
src/
├── app/                   # Next.js App Router: Routes, layouts, pages, loading/error UIs
│   ├── (auth)/            # Route group for authentication pages (e.g., sign-in, sign-up)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/       # Route group for protected dashboard pages
│   │   ├── layout.tsx     # Layout specific to the dashboard
│   │   ├── page.tsx       # Dashboard home page
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/               # API Route Handlers (backend logic)
│   │   └── [routeName]/   # e.g., users, posts
│   │       └── route.ts
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page (e.g., landing page)
│
├── components/            # Reusable UI components (shared across the app)
│   ├── ui/                # Generic UI primitives (often from shadcn/ui - e.g., Button, Card)
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── forms/             # Reusable form components (e.g., auth-form.tsx)
│   └── layout/            # Layout-specific components (e.g., Navbar, Sidebar, Footer)
│       ├── navbar.tsx
│       └── footer.tsx
│
├── modules/               # Feature-specific modules. Each module encapsulates all logic for a distinct feature domain.
│   │                      # Pages/Layouts in `src/app/` will import from these modules.
│   ├── [feature-name]/    # e.g., dashboard, social-posting, user-settings
│   │   ├── components/    # React components SOLELY used by this feature. Promote to `src/components/` if used globally.
│   │   │   └── specific-feature-component.tsx
│   │   ├── services/      # Core business logic, data fetching/mutation hooks (e.g., using React Query), API interactions for this feature.
│   │   │   └── feature-action-service.ts
│   │   │   └── use-feature-data.ts
│   │   ├── utils/         # Utility functions specific to this feature (e.g., formatters, helpers). Alternative names: `lib/`, `helpers/`.
│   │   │   └── feature-specific-helper.ts
│   │   └── types.ts       # TypeScript types and interfaces specific to this feature.
│
├── lib/                   # Utility functions, helpers, Prisma client instance (replaces `shared/`). Common convention; `utilities/` is an acceptable alternative if preferred, though `lib/` often houses more, like `prisma.ts`.
│   ├── prisma.ts          # Prisma client instance, and potentially db seeding logic
│   ├── utils.ts           # General utility functions (date formatting, string manipulation)
│   └── validators/        # Zod schemas for validation (e.g., auth-schemas.ts)
│
├── hooks/                 # Custom React hooks (e.g., use-feature-x.ts)
│
├── styles/                # Global styles (if globals.css isn't enough) - often not needed with Tailwind
│   └── globals.css        # (Typically located at `src/app/globals.css` with App Router)
│
├── types/                 # Global or shared TypeScript types/interfaces (replaces `models/`)
│   └── index.ts           # (Or specific files like `user.ts`, `post.ts`)
│
└── middleware.ts          # Next.js middleware (e.g., for auth, redirects) - (at `src/` level)

prisma/                    # Prisma schema, migrations, seed scripts (at project root, outside `src/`)
    ├── schema.prisma
    └── migrations/

public/                    # Static assets (at project root, outside `src/`)
    └── images/

scripts/                   # One-off CLI or migration scripts (at project root)

tests/                     # Unit and integration tests, mirroring `src/` structure
    └── ...
```

**Key Naming Conventions:**

*   **Files & Folders:** `kebab-case` (e.g., `user-profile`, `auth-form.tsx`).
    *   Next.js App Router specific directories (e.g., `app/(dashboard)/settings`, `app/api/[routeName]`) follow Next.js conventions.
*   **Components (React):** `PascalCase` (e.g., `UserProfile.tsx`, `AuthForm.tsx`).
*   **Variables & Functions:** `camelCase` (e.g., `const userId = ...`, `function getUserProfile() {}`).
*   **Types/Interfaces:** `PascalCase` (e.g., `interface UserProfile { ... }`).
*   **API Routes:** Directory-based, with `route.ts` as the handler file (e.g., `app/api/users/route.ts`).
*   **Hooks:** Prefix with `use` (e.g., `useAuth.ts`, `useUserProfile.ts`).
*   **Database (PostgreSQL/Prisma):**
    *   **Tables:** `snake_case` and plural (e.g., `users`, `social_posts`). Prisma maps these to `PascalCase` model names (e.g., `model User`).
    *   **Fields/Columns:** `snake_case` (e.g., `user_id`, `created_at`). Prisma maps these to `camelCase` fields in the client (e.g., `userId`).

**Alignment with Windsurf Global Rules:**

*   `src/modules/**`: Fulfilled by the `src/modules/` directory for feature-level domain logic.
*   `src/components/**`: Fulfilled by the `src/components/` directory for reusable UI.
*   `src/shared/**`: Mapped to `src/lib/` for utilities, helpers, and the Prisma client, a common Next.js pattern.
*   `src/models/**`: Mapped to `src/types/` for global/shared TypeScript types. Prisma generates its own types.
*   `tests/**`: To be added, will mirror `src/` structure.
*   `scripts/**`: Can be added at the project root.

---


This is a starting point. We can add more detail to each section.
