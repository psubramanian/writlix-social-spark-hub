# WritLix Social Spark Hub

**WritLix Social Spark Hub** is an intelligent social media management platform designed to empower users with AI-driven content creation, multi-platform scheduling, and insightful analytics. The application helps users streamline their social media workflow, generate engaging content, and optimize their online presence.

**⚠️ Project Status: AWS Migration In Progress**
This project is currently undergoing a significant migration from a Supabase-based architecture to a robust, scalable, and cost-efficient serverless architecture on Amazon Web Services (AWS).

## Core Features

*   **AI-Powered Content Generation:** Leverages OpenAI (GPT-4o-mini) to create engaging social media posts, with support for image analysis and structured prompts.
*   **Multi-Platform Support:** Seamlessly connect and manage accounts for LinkedIn, Facebook, Instagram, and Google.
*   **Advanced Content Scheduling:** Sophisticated scheduling options with timezone support, allowing users to plan their content calendar effectively.
*   **Rich Text Editing:** Create beautifully formatted posts with HTML support and see live social media previews.
*   **Bulk Content Management:** Import content ideas and posts via CSV files.
*   **User Authentication & Management:** Secure authentication using Clerk, supporting B2C and OAuth logins.
*   **Payment Integration:** Subscription management and payments handled via Stripe.
*   **Analytics & Reporting:** (Future) Track content performance and audience engagement.

## Target AWS Architecture

The new architecture is designed for scalability, reliability, and cost-effectiveness, leveraging AWS serverless technologies.

```mermaid
graph TD
    subgraph User Interaction
        A[User Browser/Mobile]
    end

    subgraph CDN & Frontend Hosting
        A -- HTTPS --> B(CloudFront CDN)
        B -- Serves Static Assets --> C(S3 Bucket: Frontend - React App)
    end

    subgraph Authentication
        A -- Auth Requests --> D(Clerk)
        D -- User Management & OAuth --> A
    end

    subgraph API Layer
        A -- API Calls --> E(API Gateway)
    end

    subgraph Backend Logic - AWS Lambda
        E -- Triggers --> F1(Lambda: Auth/User Sync)
        E -- Triggers --> F2(Lambda: Content Generation - OpenAI)
        E -- Triggers --> F3(Lambda: Social Media Posting)
        E -- Triggers --> F4(Lambda: Scheduling & Cron Jobs)
        E -- Triggers --> F5(Lambda: Payments - Stripe)
        E -- Triggers --> F6(Lambda: Webhooks - Clerk, Stripe)
    end

    subgraph Data Storage
        F1 & F2 & F3 & F4 & F5 & F6 -- CRUD Operations --> G(Amazon RDS: PostgreSQL)
        F2 & F3 -- Asset Storage/Retrieval --> H(S3 Bucket: User Assets - Images, CSVs)
    end

    subgraph External Services
        F2 -- API Call --> I(OpenAI API)
        F3 -- API Call --> J(Social Media APIs: LinkedIn, Facebook, Instagram)
        F5 -- API Call --> K(Stripe API)
        D -- Syncs User Data --> F1
        F6 -- Processes Events --> D
        F6 -- Processes Events --> K
    end

    subgraph Monitoring & Logging
        F1 & F2 & F3 & F4 & F5 & F6 -- Logs & Metrics --> L(CloudWatch)
        G -- Logs & Metrics --> L
        E -- Logs & Metrics --> L
        B -- Logs --> L
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px
    style D fill:#f8d568,stroke:#333,stroke-width:2px
    style E fill:#9f9,stroke:#333,stroke-width:2px
    style F1 fill:#ff9,stroke:#333,stroke-width:2px
    style F2 fill:#ff9,stroke:#333,stroke-width:2px
    style F3 fill:#ff9,stroke:#333,stroke-width:2px
    style F4 fill:#ff9,stroke:#333,stroke-width:2px
    style F5 fill:#ff9,stroke:#333,stroke-width:2px
    style F6 fill:#ff9,stroke:#333,stroke-width:2px
    style G fill:#c9f,stroke:#333,stroke-width:2px
    style H fill:#c9f,stroke:#333,stroke-width:2px
    style I fill:#f66,stroke:#333,stroke-width:2px
    style J fill:#f66,stroke:#333,stroke-width:2px
    style K fill:#f66,stroke:#333,stroke-width:2px
    style L fill:#ccc,stroke:#333,stroke-width:2px
```

**Key Components:**
*   **Frontend Hosting:** React application served via S3 and CloudFront.
*   **Authentication:** Clerk for user management and OAuth.
*   **Backend API:** Serverless functions (AWS Lambda) exposed via API Gateway.
*   **Database:** Amazon RDS for PostgreSQL.
*   **Storage:** S3 for user-generated assets and AI images.
*   **Payments:** Stripe integration.
*   **AI:** OpenAI for content generation.
*   **Monitoring:** CloudWatch for logging and metrics.

## Technology Stack (Target AWS)

*   **Frontend:** React 18, TypeScript, Vite
*   **UI Framework:** shadcn/ui, Radix UI, Tailwind CSS
*   **State Management:** React Query, Zustand (or Context API)
*   **Routing:** React Router v6
*   **Authentication:** Clerk (B2C + OAuth)
*   **Backend:** AWS Lambda (Node.js/TypeScript)
*   **API:** AWS API Gateway
*   **Database:** Amazon RDS (PostgreSQL)
*   **Storage:** Amazon S3
*   **CDN:** Amazon CloudFront
*   **Payments:** Stripe
*   **AI Services:** OpenAI API
*   **Infrastructure as Code:** AWS CDK or CloudFormation (as per `Technical_Implementation_Plan.md`)
*   **Monitoring:** AWS CloudWatch

## Key Directories

*   `src/`: Frontend application source code.
    *   `src/components/`: Reusable UI components.
        *   `src/components/ui/`: shadcn/ui components.
        *   `src/components/previews/`: Platform-specific post previews.
    *   `src/contexts/`: React Context providers (e.g., for global state if not using Zustand).
        *   `src/contexts/auth/`: Authentication related context (potentially refactored with Clerk).
    *   `src/hooks/`: Custom React hooks.
    *   `src/pages/`: Top-level page components.
    *   `src/services/`: API interaction logic.
    *   `src/utils/`: Utility functions.
*   `functions/` (or `lambda/`): AWS Lambda function source code (structure to be defined based on deployment strategy).
*   `project-docs/`: Detailed project planning, strategy, and execution documents.
*   `client-docs/`: Client-facing documentation and architecture overviews.
*   `scripts/`: Utility and migration scripts.

## Getting Started (Development)

### Prerequisites

*   Node.js (latest LTS version recommended)
*   npm or yarn
*   AWS CLI configured (for backend deployment and interaction)
*   Clerk account and API keys
*   OpenAI API key
*   Stripe API keys

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/psubramanian/writlix-social-spark-hub.git
    cd writlix-social-spark-hub
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory by copying `.env.example` (if it exists) or by creating a new one. Populate it with the necessary API keys and environment-specific configurations:
    ```env
    # Frontend
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
    VITE_API_URL=http://localhost:3001/api # Or your deployed API Gateway URL

    # Backend (Lambda environment variables - manage these in AWS)
    DATABASE_URL=postgresql://user:password@host:port/database
    CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
    OPENAI_API_KEY=sk_your_openai_key
    STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
    STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
    CLERK_WEBHOOK_SECRET=whsec_your_clerk_webhook_secret
    # ... other necessary variables for social media APIs, etc.
    ```
    *Note: Backend environment variables are typically managed directly in the AWS Lambda configuration, not in a local `.env` file for deployed functions.*

### Development Commands

*   **Start development server (frontend):**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:8080` (as per `CLAUDE.md`).

*   **Build for production:**
    ```bash
    npm run build
    ```

*   **Lint code:**
    ```bash
    npm run lint
    ```

*   **Preview production build (frontend):**
    ```bash
    npm run preview
    ```

For backend development (Lambda functions), refer to AWS documentation and potentially serverless framework tools if used.

## Project Documentation

This repository contains detailed documentation to guide development, understand the architecture, and manage the migration process:

*   **`CLAUDE.md`**: Provides specific guidance for AI coding assistants working on this repository, including context on the tech stack, architecture, and development patterns.
*   **`project-docs/`**: Contains internal planning and execution documents:
    *   `Technical_Implementation_Plan.md`: Detailed technical roadmap for the AWS migration.
    *   `Step_by_Step_Execution_Plan.md`: Day-by-day guide for the migration.
    *   `Migration_Strategy_and_Risk_Assessment.md`: Overall strategy, risk analysis, and mitigation plans.
*   **`client-docs/`**: Contains client-facing documentation:
    *   `AWS_Architecture_Overview.md`: High-level overview of the target AWS architecture.
    *   (Other documents as added)

Please refer to these documents for in-depth information.
