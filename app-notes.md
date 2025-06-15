# Writlix Social Spark Hub - Application Notes

## 1. Core Purpose

Automate social media posting for users through intelligent scheduling and AI-assisted content creation.

## 2. Key Features

*   **User Authentication:**
    *   Sign-up and login handled by Clerk.
*   **Social Media Account Integration:**
    *   Users connect their social media accounts (LinkedIn, Facebook, Instagram, etc.) via OAuth.
    *   OAuth flow and token management handled by Clerk.
    *   Application retrieves access tokens from Clerk on-demand for API calls to social platforms. **No direct storage of social media access tokens in the application database.**
*   **Content Creation:**
    *   Users can write their own content.
    *   AI-assisted content generation (e.g., using OpenAI) to suggest post ideas or draft content.
*   **Post Scheduling:**
    *   Users define a schedule (e.g., frequency, time of day, target platforms).
    *   The system automatically posts approved content according to the user's schedule.
*   **Instant Posting:**
    *   Option to post content immediately, outside of the regular schedule.
*   **Subscription Management:**
    *   Handled by a third-party service (Clerk or Stripe).
    *   Application database may store minimal subscription status/plan tier for feature gating, synced via webhooks.

## 3. User Flow Overview

1.  User signs up/logs in via Clerk.
2.  User connects social media accounts via Clerk.
3.  User creates/generates content ideas.
4.  User approves content for scheduling.
5.  User configures their posting schedule settings.
6.  System automatically schedules approved content based on settings.
7.  Scheduler triggers posts at the designated times:
    *   Retrieves content.
    *   Retrieves fresh social media access token from Clerk.
    *   Posts to the relevant platform.
    *   Updates post status.
8.  User can also post content instantly.
9.  User manages their subscription through Clerk/Stripe.

## 4. Key Data Entities (High-Level for Backend)

*   **User Profile Information:** (Minimal, as Clerk is primary source)
    *   `user_id` (from Clerk)
    *   Potentially app-specific preferences not stored in Clerk.
*   **Content Ideas:**
    *   `content_id`
    *   `user_id`
    *   `text_content`
    *   `media_references` (e.g., URLs to images/videos if applicable)
    *   `status` (e.g., draft, approved, scheduled, published, failed)
    *   `created_at`, `updated_at`
    *   `source_prompt` (if AI-generated)
*   **Schedule Settings:**
    *   `user_id`
    *   `frequency` (daily, weekly, custom days)
    *   `times_of_day` (list of preferred times)
    *   `timezone`
    *   `target_platforms` (list of platforms to apply settings to)
*   **Scheduled Posts:** (Instances of content to be published)
    *   `scheduled_post_id`
    *   `user_id`
    *   `content_id` (reference to the actual content)
    *   `platform` (e.g., 'linkedin', 'facebook')
    *   `scheduled_at_utc` (exact UTC time for posting)
    *   `status` (pending, processing, posted, failed)
    *   `posted_at_utc` (if successful)
    *   `platform_post_id` (ID of the post on the social media platform)
*   **User Subscription Info (Minimal Sync from Clerk/Stripe):**
    *   `user_id`
    *   `current_plan_tier` (e.g., 'free', 'pro')
    *   `is_active` (boolean)
    *   `features_enabled` (e.g., max posts, AI generation quota) - derived from plan tier.

## 5. Technical Stack Considerations

*   **Authentication:** Clerk
*   **Social OAuth & Token Management:** Clerk
*   **Subscription Billing:** Clerk or Stripe
*   **AI Content Generation:** OpenAI API (or similar)
*   **Backend:** AWS Lambda
*   **Database:** TBD (DynamoDB strong contender given simplifications)
*   **Scheduler:** AWS EventBridge Scheduler

## 6. Non-Goals (for this phase)

*   Storing social media access tokens directly.
*   Building a full subscription management system from scratch.
*   Complex analytics beyond basic post counts (initially).

## 7. Open Questions / Decisions

*   Final database choice (PostgreSQL vs. DynamoDB - leaning DynamoDB).
*   Specific schema design for chosen database.
*   Detailed error handling and retry logic for posting.
*   Webhook handling strategy for Clerk/Stripe subscription updates.
