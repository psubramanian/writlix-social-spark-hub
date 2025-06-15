# Current Task: Fix DynamoDB ContentIdea Fetch & Test Scheduled Posting

**Branch:** (Assuming current branch or feature branch name)

**Overall Goal:** Ensure the `process-scheduled-posts` Lambda can reliably fetch `ContentIdea` items, retrieve OAuth tokens, post to social media platforms, and update post statuses in DynamoDB, using LocalStack for local testing.

## Progress & Checklist:

- [x] **Fix DynamoDB `ValidationException` for `ContentIdea` Fetch:**
    - [x] Investigated `GetItemCommand` usage with AWS SDK v3 and LocalStack.
    - [x] Confirmed `ContentIdea` item exists via AWS CLI.
    - [x] Switched from `DynamoDBDocumentClient`'s `GetCommand` to base `DynamoDBClient`'s `GetItemCommand`.
    - [x] Implemented manual marshalling for the `Key` parameter (e.g., `PK: { S: 'USER#...' }`).
    - [x] **RESOLVED:** `GetItemCommand` now successfully fetches `ContentIdea` items.
    - [x] Cleaned up Lambda code structure, removed duplicated blocks, and resolved lint errors.
    - [x] Corrected iteration logic for `QueryCommand` results (`duePosts.Items` vs. `duePosts`).

- [ ] **Resolve Clerk OAuth Token Retrieval for Social Platforms:**
    - [ ] **Current Blocker:** Lambda fails to retrieve LinkedIn OAuth token from Clerk (`Failed to get linkedin access token ... Response: []`).
    - [ ] **Action (USER):** Connect the LinkedIn account for the test user (`user_2yVhrQ5sN1TMfQ5Ux2he41z2HXn`) in the Clerk application settings.
    - [ ] Add detailed logging for Clerk API calls (provider string, full error response) - *Partially done, can be enhanced if needed after account connection.*

- [ ] **Test Full Scheduled Post Processing Flow (End-to-End):**
    - [ ] Once LinkedIn token retrieval is fixed, re-run `process-scheduled-posts` Lambda.
    - [ ] Verify successful posting to LinkedIn (mocked or actual if sandbox available).
    - [ ] Verify successful posting to Facebook (mocked).
    - [ ] Verify successful posting to Instagram (mocked).
    - [ ] Verify `scheduled_post` item status is correctly updated to `posted` or `failed` in DynamoDB.
    - [ ] Verify error messages are logged correctly for failed posts.

- [ ] **Refactor and Cleanup (Future):**
    - [ ] Address known simplification in LinkedIn posting (using Clerk `userId` instead of LinkedIn URN).
    - [ ] Review and potentially refactor error counting logic if discrepancies persist.
    - [ ] Complete migration of remaining frontend components from Supabase to Clerk (as per memory `d253437b-fc86-4857-87c6-40da3e14bc4d`).

## Key Learnings/Notes:

*   When using AWS SDK v3 base `DynamoDBClient` (from `@aws-sdk/client-dynamodb`) with `GetItemCommand` against LocalStack, manual marshalling of the `Key` attribute (e.g., `Key: { PK: { S: '...' } }`) is required for it to work correctly. Using `DynamoDBDocumentClient` with an unmarshalled `Key` object caused `ValidationException` in this environment.
*   Clerk token retrieval (`clerkClient.users.getUserOauthAccessToken`) requires the user to have actively connected the specific social media account via the Clerk-managed interface.
