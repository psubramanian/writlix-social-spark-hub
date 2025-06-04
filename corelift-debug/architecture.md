# Writlix Social Spark Hub - Architecture

## Application Structure

```mermaid
graph TD
    A[Browser/Client] --> B[Vite Dev Server/Static Host]
    B --> C[React Application]
    C --> D[React Router]
    D --> E1[Landing Pages]
    D --> E2[Auth Components]
    D --> E3[Dashboard Components]
    D --> E4[Schedule Components]
    D --> E5[Subscription Components]
    C --> F[Data Layer]
    F --> G[TanStack Query]
    G --> H[Supabase Client]
    H --> I[Supabase Backend]
    
    %% UI Component Library
    C --> J[UI Components]
    J --> K[shadcn/ui + Radix Primitives]
    J --> L[Custom Components]
    K --> M[Tailwind CSS]
    L --> M
    
    %% State Management
    C --> N[Application State]
    N --> O[Context API]
    N --> P[React Hook Form]
    P --> Q[Zod Validation]
```

## Component Organization

The application follows a feature-based organization pattern:

- `src/components/` - Feature components and UI library
  - `auth/` - Authentication related components
  - `dashboard/` - Dashboard views
  - `data-seed/` - Data seeding utilities
  - `landing/` - Landing page components
  - `layout/` - Layout components (headers, footers, etc.)
  - `previews/` - Content preview components
  - `routes/` - Route definitions
  - `schedule/` - Scheduling components
  - `subscription/` - Subscription management
  - `ui/` - Reusable UI components

## Data Flow

1. User interacts with React components in the browser
2. Components use React Query/TanStack Query for data operations
3. Queries and mutations are executed via the Supabase client
4. Data is retrieved from or stored in Supabase backend services
5. UI updates reflect the new application state

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as UI Components
    participant Auth as Auth Context
    participant Supabase as Supabase Auth
    
    User->>UI: Enter credentials
    UI->>Auth: Submit login request
    Auth->>Supabase: Authentication request
    Supabase-->>Auth: Auth response (token/error)
    Auth-->>UI: Update auth state
    UI-->>User: Feedback (success/error)
    
    alt Successful login
        Auth->>Auth: Store session
        Auth->>UI: Redirect to protected route
    else Failed login
        Auth->>UI: Display error message
    end
```
