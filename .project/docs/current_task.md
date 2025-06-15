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
- [ ] Integrate Clerk for authentication:
    - [ ] Install Clerk Next.js SDK
    - [ ] Configure Clerk environment variables
    - [ ] Set up Clerk provider and middleware
    - [ ] Create basic sign-in, sign-up, and protected routes

##  backlog / upcoming
- [ ] Phase 2: Backend API Migration
- [ ] Phase 3: Frontend Integration & Refinement
- [ ] Phase 4: Deployment & Rollout