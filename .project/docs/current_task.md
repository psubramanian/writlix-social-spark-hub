# Current Tasks - Next.js Migration: Phase 1 Setup

## 🚧 In Progress (Current Branch: `dev`)

### Phase 1: Next.js Foundation & Core Setup
- [x] Initialize Next.js project (`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`)
- [ ] Install additional core dependencies (Clerk, React Query, date-fns, Lucide Icons, Zod, etc.) - *Prisma & shadcn/ui dependencies installed*
- [x] Configure Tailwind CSS (`tailwind.config.ts`, `globals.css`)
- [x] Initialize `shadcn/ui` and add initial components (e.g., button, card)
- [x] Migrate static assets from `.0-frontend-reference/public/` to Next.js `public/`
- [ ] Set up Prisma:
    - [x] Initialize Prisma (`npx prisma init`)
    - [x] Configure `.env` with PostgreSQL database URL - *Placeholder added*
    - [x] Define initial Prisma schema (`schema.prisma`) based on legacy DB and new requirements
    - [ ] Run initial migration (`npx prisma migrate dev --name init`) - *Blocked: Needs DB URL*
### Phase 1.3: Clerk Integration & Initial Page Migration
- [x] Install Clerk Next.js SDK (`npm install @clerk/nextjs`)
- [x] Configure Clerk environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, redirect URLs) in `.env`
- [x] Migrate `LoginPageHeader.tsx` to `src/components/auth/` (LoginForm & SocialLoginButtons removed as redundant with Clerk)
- [x] Create Next.js `/login` catch-all route (`src/app/login/[[...rest]]/page.tsx`) using Clerk's `<SignIn />` component and `LoginPageHeader`
- [x] Configure Clerk Provider (`<ClerkProvider>`) in `src/app/layout.tsx`
- [x] Create `middleware.ts` for route protection
- [ ] Test login/signup flow
- [ ] Migrate Dashboard page (basic structure)

##  backlog / upcoming
- [ ] Phase 2: Backend API Migration
- [ ] Phase 3: Frontend Integration & Refinement
- [ ] Phase 4: Deployment & Rollout