# AWS Deployment Preparation: `process-scheduled-posts` Lambda

This document outlines the necessary steps and considerations for deploying the `process-scheduled-posts` Lambda function from the local development environment (using LocalStack) to a live AWS environment.

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
-   [ ] **Remove `DYNAMODB_ENDPOINT`**.

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

## 10. Pre-Deployment Testing

-   [ ] **Staging Environment (Recommended):** If possible, deploy to a non-production AWS account or staging environment first.
-   [ ] **Test with Live AWS Services:** After deploying, test the Lambda with actual AWS DynamoDB and Secrets Manager.
-   [ ] **Monitor Initial Runs:** Closely monitor CloudWatch Logs for the first few executions after deployment.
