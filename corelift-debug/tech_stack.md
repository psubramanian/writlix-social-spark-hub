# Writlix Social Spark Hub - Tech Stack

## Frontend Framework
- **React** (v18.3.1) - Core UI library
- **TypeScript** (v5.5.3) - Type-safe JavaScript
- **Vite** (v5.4.1) - Build tool and development server

## UI Components & Styling
- **Tailwind CSS** (v3.4.11) - Utility-first CSS framework
- **shadcn/ui** (via Radix UI components) - Component library
- **Framer Motion** (v12.9.2) - Animation library

## State Management & Data Fetching
- **React Query** (TanStack Query v5.56.2) - Data fetching and caching
- **React Hook Form** (v7.53.0) - Form state management
- **Zod** (v3.23.8) - Schema validation

## Routing
- **React Router** (v6.26.2) - Client-side routing

## Backend Integration
- **Supabase** (v2.46.2) - Backend-as-a-Service

## Development Tools
- **ESLint** (v9.9.0) - Code linting
- **SWC** (via @vitejs/plugin-react-swc) - Fast JavaScript/TypeScript compiler

## Build/Bundling
- **Vite** - Modern bundler for production builds

## Performance Note
- Current build produces chunks larger than 500kB after minification
- Potential optimization through code splitting and manual chunk configuration
