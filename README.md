# WritLix Social Spark Hub

A modern social media content generation and management platform built with Next.js, featuring AI-powered content creation and multi-platform scheduling.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with custom gradients
- **UI Components**: shadcn/ui
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI API (planned)
- **Deployment**: Vercel (planned)

## 📱 Current Features

### ✅ Authentication & Layout
- **Clerk Integration**: Complete auth flow with login/logout
- **Modern Layout**: Sidebar navigation with gradient styling
- **Responsive Design**: Mobile-first approach
- **User Management**: Profile management with styled modals

### ✅ Dashboard
- **Overview Cards**: Content statistics and metrics
- **Quick Actions**: Easy access to main features
- **Upcoming Posts**: Scheduled content preview
- **Professional Styling**: Gradient themes with glassmorphism

### ✅ Data Seed (Content Generation)
- **AI Content Form**: Topic input with quantity slider (1-20)
- **Content Table**: Paginated view with status management
- **Status Toggle**: Review ↔ Scheduled state management
- **Preview/Edit**: Content viewing and editing capabilities
- **Delete Function**: Content removal with confirmation
- **Mock AI**: Simulated content generation (3-second delay)

## 🎨 Design System

### Color Palette
- **Primary**: Black to purple gradients
- **Accents**: Purple-600, Blue-600, Indigo-600
- **Backgrounds**: Light gradients (purple-50 to blue-50)
- **Text**: Gradient text for headings, slate for body

### Components
- **Cards**: Glassmorphism with subtle shadows
- **Buttons**: Gradient backgrounds with hover animations
- **Navigation**: Stable sidebar with smooth transitions
- **Forms**: Purple accents with proper focus states

## 📊 Database Schema

The project uses a comprehensive Prisma schema with these key models:

### ContentIdea
```typescript
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

### Supported Platforms
- LinkedIn (primary)
- Facebook
- Instagram  
- X (Twitter) - planned
- Additional platforms - future expansion

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk account for authentication

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd writlix-social-spark-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Add your Clerk keys and database URL
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Dashboard page
│   ├── data-seed/        # Content generation page
│   └── login/            # Authentication page
├── components/
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── data-seed/        # Content generation components
│   ├── layout/           # App layout (sidebar, topbar)
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## 🔄 Migration Status

This project was migrated from a legacy Supabase + React setup to modern Next.js:

### ✅ Completed
- Authentication (Supabase Auth → Clerk)
- Database (Supabase → PostgreSQL + Prisma)
- UI Framework (Basic React → Next.js + shadcn/ui)
- Styling (Basic CSS → Tailwind CSS v4)
- Layout System (Basic → Professional with gradients)

### 🚧 In Progress
- Content generation (Mock → Real AI integration)
- Database integration (Types defined, implementation pending)

### 📋 Planned
- Multi-platform content preview
- Rich text editing
- CSV import functionality
- Content scheduling
- Analytics dashboard

## 📖 Documentation

- **[DataSeed Analysis](./DATASEED_ANALYSIS.md)**: Detailed analysis of content generation features
- **[Legacy Migration Notes](./z-clerk.md)**: Authentication migration documentation

## 🔐 Environment Variables

Required environment variables for development:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/dashboard"

# AI Integration (Future)
OPENAI_API_KEY="sk-..."
```

## 🚀 Deployment

The application is designed for deployment on Vercel with PostgreSQL:

1. **Database**: Set up PostgreSQL (recommended: Supabase, Railway, or Neon)
2. **Environment**: Configure all environment variables in Vercel
3. **Build**: The app will build automatically with `npm run build`
4. **Domain**: Configure custom domain in Vercel dashboard

## 🤝 Contributing

This is a private project currently in active development. The codebase follows modern React/Next.js best practices with TypeScript for type safety.

## 📄 License

Private project - All rights reserved.
