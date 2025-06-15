# Tech Stack & Architecture Decisions

*(Document key technology choices and architectural decision records (ADRs) here)*

## Project Structure & Naming Conventions (Next.js Migration)

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
