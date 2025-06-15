# Claude Code Assistant Configuration

## Project Context
**Project**: WritLix Social Spark Hub - Multi-platform social media content management  
**Tech Stack**: Next.js 15, Prisma, PostgreSQL, Clerk, OpenAI, shadcn/ui  
**Architecture**: Next.js App Router with TypeScript  

## Key Commands & Scripts
```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run lint            # Run ESLint
npm run typecheck       # TypeScript validation

# Database  
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema to database
npx prisma studio       # Open database GUI

# UI Components
npx shadcn@latest add <component>  # Add shadcn/ui components
```

## Project Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components  
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript definitions
└── middleware.ts       # Clerk auth middleware
```

## Current State
### ✅ Completed Features
- Authentication with Clerk (login/logout flow)
- Modern layout with sidebar navigation
- Dashboard with stat cards and components
- DataSeed page with content generation (mock AI)
- Responsive design with gradient styling

### 🚧 Active Development
- Database integration (Prisma schema exists, implementation pending)
- Real AI content generation (OpenAI integration)
- Multi-platform content preview

## Database Schema Key Models
```typescript
// Core content storage
model ContentIdea {
  id              String            @id @default(cuid())
  userId          String            // Clerk User ID
  textContent     String            @db.Text
  status          ContentIdeaStatus // DRAFT | APPROVED | SCHEDULED | PUBLISHED
  sourcePrompt    String?           @db.Text
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
```

## Environment Variables Required
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/dashboard"
```

## Design System
### Colors
- **Primary Gradients**: `from-black via-slate-800 to-purple-600`
- **Backgrounds**: Light gradients (`from-purple-50 to-blue-50`)
- **Interactive**: Purple-600, Blue-600 accents
- **Text**: Gradient headings, slate body text

### Components
- Cards: Glassmorphism with `bg-gradient-to-br from-white to-purple-50/50`
- Buttons: Gradient backgrounds with hover animations
- Navigation: Stable sidebar with smooth color transitions

## Known Issues & Quirks
- Sidebar navigation links had text jumping on hover (fixed with stable transitions)
- Clerk UserButton requires custom styling for theme consistency
- Content status mapping: `Review` ↔ `APPROVED`, `Scheduled` ↔ `SCHEDULED`

## Development Patterns
- Use `"use client"` for interactive components
- Import types with `import type { } from`
- Follow shadcn/ui component patterns
- Maintain consistent gradient styling across components
- Test authentication flows in incognito mode

## Next Priorities
1. Database integration with existing Prisma schema
2. OpenAI API integration for real content generation
3. Multi-platform content preview dialog
4. Rich text editing capabilities

Last Updated: 2025-06-15