# Technical Implementation Plan
## Supabase to AWS Migration - Internal Documentation

**Project:** Writlix Social Spark Hub Migration  
**Timeline:** 2-3 weeks  
**Team:** 1 Full-Stack Developer  
**Budget:** $500  

---

## 1. Pre-Migration Analysis Summary

### Current Supabase Architecture
- **Database:** PostgreSQL with 12 tables, complex user relationships
- **Edge Functions:** 15 functions handling OAuth, content generation, social posting
- **Authentication:** Supabase Auth with custom recovery mechanisms
- **Storage:** Minimal file storage, mostly external URLs
- **Monthly Cost:** ~$100-150 (scaling beyond acceptable limits)

### Migration Complexity Assessment
- **Low Complexity:** External API integrations (preserve as-is)
- **Medium Complexity:** Database schema migration, Lambda functions
- **High Complexity:** Authentication migration, user data mapping

---

## 2. Phase 1: Infrastructure Setup (Days 1-3)

### 2.1 AWS Account Setup
**Tasks:**
```bash
# AWS CLI configuration
aws configure
aws sts get-caller-identity

# Create IAM user for deployment
aws iam create-user --user-name writlix-deploy
aws iam attach-user-policy --user-name writlix-deploy --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Setup MFA and secure access keys
```

**Resources to Create:**
- IAM roles for Lambda functions
- VPC and security groups for RDS
- S3 bucket with CORS configuration
- RDS subnet group for database isolation

### 2.2 RDS PostgreSQL Setup
```yaml
# CloudFormation template snippet
WritlixDatabase:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceIdentifier: writlix-production
    DBInstanceClass: db.t3.micro
    Engine: postgres
    EngineVersion: '14.9'
    AllocatedStorage: 20
    StorageType: gp2
    MasterUsername: writlix_admin
    MasterUserPassword: !Ref DatabasePassword
    VPCSecurityGroups:
      - !Ref DatabaseSecurityGroup
    DBSubnetGroupName: !Ref DBSubnetGroup
    BackupRetentionPeriod: 7
    MultiAZ: false  # Cost optimization
    StorageEncrypted: true
    DeletionProtection: true
```

**Database Configuration:**
- Create database: `writlix_production`
- Setup connection pooling
- Configure parameter groups for optimization
- Enable performance insights (free tier)

### 2.3 Clerk Authentication Setup
**Steps:**
1. Create Clerk application
2. Configure OAuth providers:
   ```javascript
   // OAuth Provider Configuration
   const oauthProviders = {
     google: {
       clientId: process.env.GOOGLE_CLIENT_ID,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       scopes: ['openid', 'email', 'profile']
     },
     linkedin_oidc: {
       clientId: process.env.LINKEDIN_CLIENT_ID,
       clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
       scopes: ['openid', 'email', 'profile']
     }
   }
   ```
3. Setup webhooks for user events
4. Configure user metadata schema

**Webhook Configuration:**
```javascript
// webhook-handler.js
const handleClerkWebhook = async (event) => {
  switch (event.type) {
    case 'user.created':
      await createUserProfile(event.data);
      break;
    case 'user.updated':
      await updateUserProfile(event.data);
      break;
    case 'user.deleted':
      await deleteUserData(event.data);
      break;
  }
};
```

### 2.4 API Gateway Setup
```yaml
# API Gateway configuration
WritlixAPI:
  Type: AWS::ApiGateway::RestApi
  Properties:
    Name: writlix-api
    Description: Writlix Social Spark Hub API
    EndpointConfiguration:
      Types:
        - REGIONAL
    Policy:
      Statement:
        - Effect: Allow
          Principal: '*'
          Action: 'execute-api:Invoke'
          Resource: '*'
```

**Endpoints Structure:**
- `/auth` - Authentication and user management
- `/content` - Content generation and management
- `/social` - Social media operations
- `/subscription` - Payment and subscription handling
- `/utility` - Validation and utility functions

---

## 3. Phase 2: Database Migration (Days 4-6)

### 3.1 Schema Analysis and Optimization

**Tables to Eliminate (Handled by Clerk):**
```sql
-- These tables will be removed as Clerk handles this data
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_auth_sessions CASCADE;
-- Auth-related tables no longer needed
```

**Tables to Migrate:**
```sql
-- Core business data tables
CREATE TABLE content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    title TEXT,
    content TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_social_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT, -- Encrypted
    expires_at TIMESTAMP WITH TIME ZONE,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'inactive',
    subscription_id VARCHAR(255), -- Stripe subscription ID
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE schedule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    frequency VARCHAR(50) DEFAULT 'daily',
    time_of_day TIME DEFAULT '09:00:00',
    timezone VARCHAR(100) DEFAULT 'UTC',
    days_of_week INTEGER[], -- For weekly frequency
    day_of_month INTEGER, -- For monthly frequency
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 Data Migration Scripts

**User ID Mapping Strategy:**
```javascript
// migration-scripts/user-id-mapping.js
const migrateUserIds = async () => {
  const supabaseUsers = await supabase
    .from('profiles')
    .select('id, email, name');
  
  const mappings = [];
  
  for (const user of supabaseUsers) {
    // Find corresponding Clerk user by email
    const clerkUser = await clerkClient.users.getUserList({
      emailAddress: [user.email]
    });
    
    if (clerkUser.length > 0) {
      mappings.push({
        supabase_id: user.id,
        clerk_id: clerkUser[0].id,
        email: user.email
      });
    }
  }
  
  return mappings;
};
```

**Content Migration:**
```javascript
// migration-scripts/content-migration.js
const migrateContent = async (userMappings) => {
  const contentIdeas = await supabase
    .from('content_ideas')
    .select('*');
  
  for (const content of contentIdeas) {
    const mapping = userMappings.find(m => m.supabase_id === content.user_id);
    if (mapping) {
      await rdsClient.query(`
        INSERT INTO content_ideas (id, user_id, title, content, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        content.id,
        mapping.clerk_id,
        content.title,
        content.content,
        content.status,
        content.created_at,
        content.updated_at
      ]);
    }
  }
};
```

### 3.3 Data Validation and Testing
```javascript
// migration-scripts/validation.js
const validateMigration = async () => {
  const validations = {
    contentCount: await validateContentCount(),
    userMappings: await validateUserMappings(),
    credentials: await validateCredentials(),
    subscriptions: await validateSubscriptions()
  };
  
  return validations;
};
```

---

## 4. Phase 3: Lambda Function Development (Days 7-12)

### 4.1 Function Development Strategy

**Base Lambda Configuration:**
```javascript
// lambda-base/config.js
const baseConfig = {
  runtime: 'nodejs18.x',
  timeout: 30,
  memorySize: 256,
  environment: {
    NODE_ENV: 'production',
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  layers: [
    'arn:aws:lambda:us-east-1:123456789012:layer:shared-dependencies:1'
  ]
};
```

### 4.2 OAuth Functions Migration

**Facebook OAuth Handler:**
```javascript
// functions/facebook-oauth/index.js
const { verifyClerkToken } = require('/opt/auth-utils');
const { encryptToken } = require('/opt/crypto-utils');

exports.handler = async (event) => {
  try {
    // Verify Clerk authentication
    const user = await verifyClerkToken(event.headers.authorization);
    
    // Process OAuth callback
    const { code, state } = JSON.parse(event.body);
    
    // Exchange code for token
    const tokenResponse = await exchangeFacebookCode(code);
    
    // Store encrypted credentials
    await storeCredentials(user.id, 'facebook', {
      access_token: await encryptToken(tokenResponse.access_token),
      expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000)
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

**LinkedIn OAuth Handler:**
```javascript
// functions/linkedin-oauth/index.js
exports.handler = async (event) => {
  try {
    const user = await verifyClerkToken(event.headers.authorization);
    const { code, state } = JSON.parse(event.body);
    
    // LinkedIn token exchange
    const tokenData = await exchangeLinkedInCode(code);
    
    // Get user profile and organizations
    const [profile, organizations] = await Promise.all([
      getLinkedInProfile(tokenData.access_token),
      getLinkedInOrganizations(tokenData.access_token)
    ]);
    
    // Store credentials and profile data
    await storeCredentials(user.id, 'linkedin', {
      access_token: await encryptToken(tokenData.access_token),
      refresh_token: await encryptToken(tokenData.refresh_token),
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
      profile_data: { profile, organizations }
    });
    
    return successResponse({ profile, organizations });
  } catch (error) {
    return errorResponse(error);
  }
};
```

### 4.3 Content Generation Functions

**Content Generation with OpenAI:**
```javascript
// functions/generate-content/index.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  try {
    const user = await verifyClerkToken(event.headers.authorization);
    const { topic, tone = 'professional' } = JSON.parse(event.body);
    
    const prompt = buildContentPrompt(topic, tone);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional LinkedIn content creator. Generate engaging, professional posts with proper HTML formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const generatedContent = completion.choices[0].message.content;
    
    // Store generated content
    const contentId = await storeContentIdea(user.id, {
      title: topic,
      content: generatedContent,
      status: 'draft'
    });
    
    return successResponse({
      id: contentId,
      content: generatedContent
    });
  } catch (error) {
    return errorResponse(error);
  }
};
```

### 4.4 Social Media Posting Functions

**LinkedIn Posting Function:**
```javascript
// functions/post-to-linkedin/index.js
exports.handler = async (event) => {
  try {
    const { contentId, immediate = false } = JSON.parse(event.body);
    
    // Get content and user credentials
    const [content, credentials] = await Promise.all([
      getContentById(contentId),
      getCredentials(content.user_id, 'linkedin')
    ]);
    
    // Verify token validity
    await validateAndRefreshToken(credentials);
    
    // Post to LinkedIn
    const postData = {
      author: `urn:li:person:${credentials.profile_data.profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };
    
    const response = await postToLinkedIn(credentials.access_token, postData);
    
    // Update content status
    await updateContentStatus(contentId, 'published', new Date());
    
    return successResponse({
      postId: response.id,
      url: `https://www.linkedin.com/feed/update/${response.id}`
    });
  } catch (error) {
    return errorResponse(error);
  }
};
```

### 4.5 Shared Utilities Layer

**Lambda Layer Structure:**
```
shared-layer/
├── nodejs/
│   ├── node_modules/
│   │   └── (shared dependencies)
│   └── opt/
│       ├── auth-utils.js
│       ├── crypto-utils.js
│       ├── db-utils.js
│       ├── social-api-utils.js
│       └── validation-utils.js
```

**Authentication Utilities:**
```javascript
// shared-layer/opt/auth-utils.js
const { verifyToken } = require('@clerk/clerk-sdk-node');

const verifyClerkToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = { verifyClerkToken };
```

---

## 5. Phase 4: Frontend Integration (Days 13-15)

### 5.1 Clerk Integration

**Replace Supabase Auth:**
```jsx
// src/contexts/auth/AuthProvider.tsx
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

export const AuthProvider = ({ children }) => {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </ClerkProvider>
  );
};

const AuthContextProvider = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated: isSignedIn,
      isLoading: !isLoaded,
      user: user,
      // ... other auth methods
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5.2 API Client Updates

**Replace Supabase Client:**
```javascript
// src/lib/api-client.js
class APIClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL;
  }
  
  async request(endpoint, options = {}) {
    const { getToken } = await import('@clerk/clerk-react');
    const token = await getToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Content operations
  async generateContent(topic, tone) {
    return this.request('/content/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, tone })
    });
  }
  
  // OAuth operations
  async handleFacebookOAuth(code, state) {
    return this.request('/auth/facebook/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state })
    });
  }
}

export const apiClient = new APIClient();
```

---

## 6. Testing Strategy (Days 16-18)

### 6.1 Unit Testing

**Lambda Function Tests:**
```javascript
// tests/functions/generate-content.test.js
const { handler } = require('../../functions/generate-content');

describe('Generate Content Function', () => {
  test('should generate content for valid topic', async () => {
    const event = {
      headers: {
        authorization: 'Bearer valid-clerk-token'
      },
      body: JSON.stringify({
        topic: 'AI in modern business',
        tone: 'professional'
      })
    };
    
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('content');
  });
});
```

### 6.2 Integration Testing

**End-to-End OAuth Flow:**
```javascript
// tests/integration/oauth-flow.test.js
describe('OAuth Integration', () => {
  test('complete LinkedIn OAuth flow', async () => {
    // 1. Get auth URL
    const authUrl = await apiClient.getLinkedInAuthUrl();
    
    // 2. Simulate OAuth callback
    const mockCode = 'mock-auth-code';
    const result = await apiClient.handleLinkedInOAuth(mockCode, 'state');
    
    // 3. Verify credentials stored
    expect(result.success).toBe(true);
  });
});
```

### 6.3 Performance Testing

**Load Testing Lambda Functions:**
```javascript
// tests/performance/load-test.js
const loadTest = async () => {
  const requests = Array(100).fill().map(() => 
    apiClient.generateContent('Test topic', 'professional')
  );
  
  const startTime = Date.now();
  const results = await Promise.allSettled(requests);
  const endTime = Date.now();
  
  console.log(`Average response time: ${(endTime - startTime) / 100}ms`);
  console.log(`Success rate: ${results.filter(r => r.status === 'fulfilled').length}%`);
};
```

---

## 7. Deployment and Monitoring (Days 19-21)

### 7.1 Infrastructure as Code

**CloudFormation/CDK Deployment:**
```typescript
// infrastructure/writlix-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class WritlixStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Lambda functions
    const generateContentFunction = new lambda.Function(this, 'GenerateContent', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('functions/generate-content'),
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!
      }
    });
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'WritlixAPI');
    const contentResource = api.root.addResource('content');
    contentResource.addMethod('POST', new apigateway.LambdaIntegration(generateContentFunction));
  }
}
```

### 7.2 Monitoring Setup

**CloudWatch Dashboards:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "writlix-generate-content"],
          ["AWS/Lambda", "Errors", "FunctionName", "writlix-generate-content"],
          ["AWS/Lambda", "Invocations", "FunctionName", "writlix-generate-content"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Content Generation Function Metrics"
      }
    }
  ]
}
```

**Cost Monitoring:**
```javascript
// monitoring/cost-alerts.js
const createCostAlert = async () => {
  const params = {
    BudgetName: 'WritlixMonthlyCost',
    Budget: {
      BudgetName: 'WritlixMonthlyCost',
      BudgetLimit: {
        Amount: '100',
        Unit: 'USD'
      },
      TimeUnit: 'MONTHLY',
      BudgetType: 'COST'
    },
    NotificationsWithSubscribers: [
      {
        Notification: {
          NotificationType: 'ACTUAL',
          ComparisonOperator: 'GREATER_THAN',
          Threshold: 80
        },
        Subscribers: [
          {
            SubscriptionType: 'EMAIL',
            Address: 'alerts@company.com'
          }
        ]
      }
    ]
  };
  
  await budgets.createBudget(params).promise();
};
```

---

## 8. Rollback and Recovery Procedures

### 8.1 Rollback Strategy
```bash
#!/bin/bash
# rollback-procedure.sh

echo "Starting rollback procedure..."

# 1. Switch DNS back to old Supabase endpoints
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch file://rollback-dns.json

# 2. Restore database from backup
aws rds restore-db-instance-from-db-snapshot --db-instance-identifier writlix-rollback --db-snapshot-identifier writlix-pre-migration

# 3. Update frontend configuration
kubectl set env deployment/writlix-frontend REACT_APP_API_URL=https://old-api.supabase.co

echo "Rollback completed. System restored to previous state."
```

### 8.2 Data Recovery
```sql
-- Emergency data recovery queries
-- Restore user mappings
INSERT INTO user_id_mappings (supabase_id, clerk_id, email)
SELECT * FROM backup_user_mappings;

-- Restore content with proper user mapping
INSERT INTO content_ideas (id, user_id, title, content, status, created_at)
SELECT 
  c.id,
  m.clerk_id,
  c.title,
  c.content,
  c.status,
  c.created_at
FROM backup_content_ideas c
JOIN user_id_mappings m ON c.user_id = m.supabase_id;
```

---

## 9. Success Metrics and KPIs

### 9.1 Technical Metrics
```javascript
// monitoring/metrics-collector.js
const collectMetrics = async () => {
  return {
    // Performance metrics
    avgResponseTime: await getAvgResponseTime(),
    errorRate: await getErrorRate(),
    uptime: await getUptime(),
    
    // Cost metrics
    monthlyCost: await getMonthlyCost(),
    costPerUser: await getCostPerUser(),
    
    // Usage metrics
    activeUsers: await getActiveUsers(),
    apiCalls: await getApiCalls(),
    contentGenerated: await getContentGenerated()
  };
};
```

### 9.2 Business Metrics
- User retention rate during migration
- Feature adoption post-migration
- Customer satisfaction scores
- Support ticket volume
- Revenue impact assessment

---

This technical implementation plan provides a comprehensive roadmap for executing the Supabase to AWS migration while maintaining system reliability and achieving cost optimization goals.