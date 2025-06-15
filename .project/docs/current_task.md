# Current Task: Implement Multi-Platform Social Posting & Refine Lambda

**Branch:** (Assuming current branch or feature branch name)

**Overall Goal:** Extend the `process-scheduled-posts` Lambda to support Facebook and Instagram posting, building upon the successful LinkedIn implementation. Ensure robust error handling, OAuth token management, and status updates for all platforms, using LocalStack for local testing.

## Progress & Checklist:

- [x] **Fix DynamoDB `ValidationException` for `ContentIdea` Fetch:**
    - [x] Investigated `GetItemCommand` usage with AWS SDK v3 and LocalStack.
    - [x] Confirmed `ContentIdea` item exists via AWS CLI.
    - [x] Switched from `DynamoDBDocumentClient`'s `GetCommand` to base `DynamoDBClient`'s `GetItemCommand`.
    - [x] Implemented manual marshalling for the `Key` parameter (e.g., `PK: { S: 'USER#...' }`).
    - [x] **RESOLVED:** `GetItemCommand` now successfully fetches `ContentIdea` items.
    - [x] Cleaned up Lambda code structure, removed duplicated blocks, and resolved lint errors.
    - [x] Corrected iteration logic for `QueryCommand` results (`duePosts.Items` vs. `duePosts`).

- [x] **Resolve Clerk OAuth Token Retrieval for Social Platforms:**
    - [x] **RESOLVED:** Lambda now successfully retrieves LinkedIn OAuth token from Clerk using `oauth_linkedin_oidc` provider string.
        - Initial issue was a delay in the connected account appearing in Clerk dashboard.
        - Subsequent issue was using `oauth_linkedin` instead of `oauth_linkedin_oidc` provider string.

- [x] **Resolve LinkedIn Post Author URN Issue:**
    - [x] **RESOLVED:** `postToLinkedIn` no longer fails with 422 error. Clerk `userId` is used to fetch `externalId` for the LinkedIn Member URN.
    - [x] **Action:** Modified Lambda to fetch the full Clerk user object (`clerkClient.users.getUser(userId)`).
    - [x] **Action:** Implemented logic to extract `externalId` from `clerkUser.externalAccounts` (where provider is `oauth_linkedin_oidc`) and construct the LinkedIn Author URN (e.g., `urn:li:person:{externalId}`).
    - [x] **Action:** Added robust error handling: if `externalId` is not found for LinkedIn or Clerk user fetch fails, an error is thrown to fail the specific post.
    - [x] **Action:** Corrected `postToLinkedIn` function signature and parameter passing from the handler to use the proper `authorUrn` and `content`.
    - [x] **Refactoring:** Moved `postToLinkedIn` function to `utils/linkedinService.js`.
    - [x] **Fixing `app.js`:** Reconstructed the main handler loop in `app.js`, imported and integrated `linkedinService.postToLinkedIn`, and removed old posting helper functions. This should resolve previous structural damage and lint errors.
        - Verify Clerk dashboard configuration for LinkedIn OAuth provider (credentials, redirect URIs).
        - Verify LinkedIn developer app configuration (redirect URIs).
        - Ensure the frontend components (`<SignIn />`, `<UserProfile />`, or custom flow) correctly establish the connection and associate it with the Clerk user.
    - [ ] Add detailed logging for Clerk API calls (provider string, full error response) - *Done in Lambda, scope issue for `providerString` in catch block also fixed.*

- [ ] **Next Steps (Social Platforms):**
    - [x] Created `utils/facebookService.js` with placeholder `postToFacebook`.
    - [x] Created `utils/instagramService.js` with placeholder `postToInstagram`.
    - [x] Updated `app.js` to import and call these new service functions.
    - [ ] Implement actual posting logic in `postToFacebook` in `utils/facebookService.js` (requires Facebook App setup, Page ID, permissions).
    - [ ] Implement actual posting logic in `postToInstagram` in `utils/instagramService.js` (requires Instagram Business Account, Facebook Page link, permissions).
    - [ ] Add logic to `app.js` to fetch specific OAuth tokens for Facebook (`oauth_facebook`) and Instagram (likely via Facebook `oauth_facebook` with `instagram_basic`, `instagram_content_publish` permissions).

- [x] **Test Full Scheduled Post Processing Flow (End-to-End for LinkedIn):**
    - [x] Re-ran `process-scheduled-posts` Lambda after LinkedIn fixes.
    - [x] Verified successful posting to LinkedIn (actual post made).
    - [x] Verified `scheduled_post` item status is correctly updated to `posted` or `failed` in DynamoDB for LinkedIn.
    - [x] Verified error messages are logged correctly for failed posts for LinkedIn.
- [ ] **Test Full Scheduled Post Processing Flow (End-to-End for Facebook & Instagram):**
    - [ ] Verify successful posting to Facebook (mocked initially, then actual).
    - [ ] Verify successful posting to Instagram (mocked initially, then actual).
    - [ ] Verify `scheduled_post` item status updates for Facebook & Instagram.
    - [ ] Verify error message logging for Facebook & Instagram.

- [ ] **Refactor and Cleanup (Future):**
    - [ ] Review and potentially refactor error counting logic if discrepancies persist.
    - [ ] Complete migration of remaining frontend components from Supabase to Clerk (as per memory `d253437b-fc86-4857-87c6-40da3e14bc4d`).

## Key Learnings/Notes:

*   When using AWS SDK v3 base `DynamoDBClient` (from `@aws-sdk/client-dynamodb`) with `GetItemCommand` against LocalStack, manual marshalling of the `Key` attribute (e.g., `Key: { PK: { S: '...' } }`) is required for it to work correctly. Using `DynamoDBDocumentClient` with an unmarshalled `Key` object caused `ValidationException` in this environment.
*   Clerk token retrieval (`clerkClient.users.getUserOauthAccessToken`) requires the user to have actively connected the specific social media account via the Clerk-managed interface, AND this connection must be successfully recorded and visible in the Clerk user's profile under "Social accounts".
