# Changelog

## 2025-06-14

- **Lambda: `process-scheduled-posts`**
    - Successfully refactored LinkedIn posting logic into `utils/linkedinService.js`.
    - Reconstructed main handler loop in `app.js`, resolving structural issues and lint errors.
    - Confirmed end-to-end LinkedIn posting functionality: fetches scheduled posts, retrieves content, obtains Clerk OAuth token and LinkedIn User URN, posts to LinkedIn, and updates DynamoDB status.
    - Created placeholder service files (`utils/facebookService.js`, `utils/instagramService.js`) and integrated them into `app.js` for future Facebook and Instagram posting implementation.
    - Fixed DynamoDB `ValidationException` for `ContentIdea` fetching by using base `DynamoDBClient` with manual key marshalling.
    - Resolved Clerk OAuth token retrieval issues for LinkedIn by using the correct `oauth_linkedin_oidc` provider string and ensuring account propagation in Clerk dashboard.
    - Correctly implemented LinkedIn Author URN construction using `externalId` from Clerk user's `externalAccounts`.
