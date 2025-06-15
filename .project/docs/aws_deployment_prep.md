# AWS Deployment Preparation: Full Application Stack

This document outlines the necessary steps and considerations for deploying the complete Writlix Social Spark Hub application from the local development environment (using LocalStack) to a live AWS environment.

## CRITICAL PRE-DEPLOYMENT NOTE (June 15, 2025)
🚨 **LocalStack Lambda Code Update Issue**: Before AWS deployment, fix the LocalStack Lambda code update problem that prevents schedule settings from updating properly. This must be resolved and tested locally first.

## 1. Secrets Management

-   [ ] **Clerk Secret Key (`CLERK_SECRET_KEY`):**
    -   [ ] Store `CLERK_SECRET_KEY` in **AWS Secrets Manager**.
        -   Choose an appropriate secret name (e.g., `writlix/clerk/secret_key`).
        -   Store as a JSON key-value pair, e.g., `{"CLERK_SECRET_KEY": "sk_live_..."}`.
    -   [ ] Update Lambda IAM execution role to grant `secretsmanager:GetSecretValue` permission for this specific secret.
    -   [ ] Modify `app.js` to fetch the secret from AWS Secrets Manager at runtime (e.g., during Lambda cold start).
        -   Use AWS SDK v3 `SecretsManagerClient` and `GetSecretValueCommand`.
        -   Implement logic to use `process.env.CLERK_SECRET_KEY` for local dev and fetch from Secrets Manager in AWS environment.

## 2. DynamoDB Configuration

-   [ ] **DynamoDB Table (`WritlixSocialHub`):**
    -   [ ] Ensure the `WritlixSocialHub` table is created in the target AWS region.
    -   [ ] Verify the table has the same primary key schema (PK, SK) as used locally.
    -   [ ] Verify the Global Secondary Index (`ScheduledPostsByStatusAndDate` with GSI1PK, GSI1SK) is created and configured correctly.
-   [ ] **DynamoDB Endpoint:**
    -   [ ] Remove the `DYNAMODB_ENDPOINT` environment variable from the Lambda configuration in AWS.
    -   [ ] Ensure `app.js` initializes `DynamoDBClient` without a custom endpoint when in AWS (SDK will auto-discover).

## 3. IAM Permissions (Lambda Execution Role)

-   [ ] **Create/Configure Lambda Execution Role:**
    -   [ ] **DynamoDB:**
        -   `dynamodb:Query` (on table and `ScheduledPostsByStatusAndDate` GSI)
        -   `dynamodb:GetItem`
        -   `dynamodb:UpdateItem`
    -   [ ] **CloudWatch Logs:**
        -   `logs:CreateLogGroup`
        -   `logs:CreateLogStream`
        -   `logs:PutLogEvents`
    -   [ ] **AWS Secrets Manager:**
        -   `secretsmanager:GetSecretValue` (for the specific Clerk secret ARN).
    -   [ ] **(Optional) AWS X-Ray:**
        -   `xray:PutTraceSegments` (if X-Ray tracing is enabled).

## 4. Lambda Environment Variables (in AWS Console/IaC)

-   [ ] **`AWS_REGION`:** Set to the target AWS region (e.g., `us-east-1`).
-   [ ] **`CLERK_SECRET_NAME`:** (Recommended) Set to the name or ARN of the secret in AWS Secrets Manager (e.g., `writlix/clerk/secret_key`). This tells the code which secret to fetch.
-   [ ] **`NODE_ENV`:** Set to `production` or similar, to differentiate from `development`.
-   [ ] **Remove `DYNAMODB_ENDPOINT`** - Critical for AWS deployment (currently set to LocalStack endpoint).
-   [ ] **Remove `LOCALSTACK_HOSTNAME`** - LocalStack-specific variable not needed in AWS.

## 5. Lambda Function Configuration (in AWS Console/IaC)

-   [ ] **Runtime:** Select appropriate Node.js version (e.g., Node.js 20.x).
-   [ ] **Handler:** `app.handler`.
-   [ ] **Memory Allocation:** Monitor and adjust from default (128MB) as needed. Start with 256MB or 512MB and tune.
-   [ ] **Timeout:** Increase from default (3 seconds). Start with 30-60 seconds and tune based on observed execution times.
-   [ ] **Architecture:** (e.g., `arm64` for Graviton or `x86_64`).

## 6. Lambda Trigger

-   [ ] **Amazon EventBridge (CloudWatch Events) Rule:**
    -   [ ] Create a scheduled rule to trigger the Lambda (e.g., `rate(5 minutes)`).
    -   [ ] Ensure the EventBridge rule has permission to invoke the Lambda function.

## 7. Code Adjustments in `app.js`

-   [ ] **Secrets Manager Integration:** Implement the logic to fetch `CLERK_SECRET_KEY` from Secrets Manager when running in AWS (see section 1).
-   [ ] **DynamoDB Client Initialization:** Ensure the `DynamoDBClient` is initialized correctly for both local (with endpoint) and AWS (without endpoint) environments.

## 8. Logging & Monitoring

-   [ ] **CloudWatch Logs:** Rely on `console.log` which will direct output to CloudWatch Logs in AWS.
-   [ ] **(Optional) AWS X-Ray:** Enable X-Ray tracing in Lambda configuration for deeper insights if needed.

## 9. Deployment Package (.zip file)

-   [ ] **Contents:** Ensure the .zip file includes:
    -   `app.js`
    -   `utils/` directory (with `linkedinService.js`, `facebookService.js`, `instagramService.js`)
    -   All production `node_modules` (run `npm install --omit=dev` or `yarn install --production` before zipping).
    -   `package.json` and `package-lock.json` (or `yarn.lock`).
-   [ ] **File/Folder Structure:** Maintain the same relative paths as in the development environment.

## 10. Frontend Configuration for AWS

-   [ ] **Environment Variables Update:**
    -   [ ] **`VITE_API_BASE_URL`:** Change from LocalStack URL to AWS API Gateway URL
        -   Current: `https://7flpdj3bgn.execute-api.localhost.localstack.cloud:4566/prod`
        -   AWS: `https://{api-id}.execute-api.{region}.amazonaws.com/prod`
    -   [ ] **Clerk Keys:** Update to production Clerk keys if different from dev
-   [ ] **Build Configuration:**
    -   [ ] Run `npm run build` to create production build
    -   [ ] Test production build locally with `npm run preview`
-   [ ] **S3 + CloudFront Deployment:**
    -   [ ] Create S3 bucket for static hosting
    -   [ ] Configure CloudFront distribution
    -   [ ] Update CORS settings for new domain

## 11. CDK Stack Modifications for AWS

-   [ ] **Remove LocalStack-specific configurations:**
    -   [ ] Remove `DYNAMODB_ENDPOINT` environment variable from Lambda
    -   [ ] Remove `LOCALSTACK_HOSTNAME` environment variable
    -   [ ] Update timeout from 5 minutes to appropriate production value (30-60 seconds)
-   [ ] **API Gateway Configuration:**
    -   [ ] Ensure CORS allows production frontend domain
    -   [ ] Configure custom domain if needed
-   [ ] **DynamoDB Table:**
    -   [ ] Configure appropriate read/write capacity or on-demand billing
    -   [ ] Set up backup and point-in-time recovery

## 12. Critical Testing Before AWS Deployment

-   [ ] **🚨 MUST FIX FIRST**: Resolve LocalStack Lambda code update issue
    -   [ ] Ensure schedule updates work properly in LocalStack
    -   [ ] Verify all CRUD operations function correctly
    -   [ ] Test with real user data and scenarios
-   [ ] **End-to-End Testing:**
    -   [ ] Complete schedule creation/modification workflow
    -   [ ] Verify frontend-backend integration
    -   [ ] Test error handling and edge cases

## 13. Pre-Deployment Testing

-   [ ] **Staging Environment (Recommended):** If possible, deploy to a non-production AWS account or staging environment first.
-   [ ] **Test with Live AWS Services:** After deploying, test the Lambda with actual AWS DynamoDB and Secrets Manager.
-   [ ] **Monitor Initial Runs:** Closely monitor CloudWatch Logs for the first few executions after deployment.

## 14. Post-Deployment Verification

-   [ ] **API Endpoints:** Test all endpoints with production URLs
-   [ ] **Database Operations:** Verify schedule CRUD operations work
-   [ ] **Authentication:** Confirm Clerk integration works with production keys
-   [ ] **Frontend:** Test complete user workflows in production environment
