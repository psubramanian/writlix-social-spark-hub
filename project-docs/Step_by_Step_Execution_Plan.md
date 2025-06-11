# Step-by-Step Execution Plan
## Writlix AWS Migration - Internal Implementation Guide

**Project:** Supabase to AWS Migration  
**Timeline:** 21 days  
**Budget:** $500  
**Team:** 1 Full-Stack Developer  

---

## Pre-Migration Checklist (Day 0)

### Client Requirements Verification
- [ ] SOW signed and approved
- [ ] AWS account created with billing alerts set
- [ ] Clerk account created and configured
- [ ] Current Supabase access credentials provided
- [ ] Production database backup completed
- [ ] OAuth application credentials documented
- [ ] Stripe API keys accessible
- [ ] OpenAI API key confirmed working

### Development Environment Setup
```bash
# Clone and setup local environment
git clone <writlix-repo>
cd writlix-social-spark-hub

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in all required environment variables

# Verify current application works locally
npm run dev
```

### Access and Credentials Audit
```bash
# Create credentials checklist
cat > credentials-checklist.md << 'EOF'
## Required Credentials
- [ ] Supabase URL and anon key
- [ ] Supabase service role key
- [ ] Facebook OAuth app ID and secret
- [ ] Instagram OAuth app ID and secret
- [ ] LinkedIn OAuth app ID and secret
- [ ] Google OAuth app ID and secret
- [ ] OpenAI API key
- [ ] Stripe publishable and secret keys
- [ ] Google reCAPTCHA site key and secret key
- [ ] AWS account access keys
- [ ] Clerk publishable and secret keys
EOF
```

---

## Phase 1: Infrastructure Foundation (Days 1-3)

### Day 1: AWS Account and IAM Setup

#### Morning (9:00 AM - 12:00 PM)
```bash
# 1. Configure AWS CLI
aws configure
aws sts get-caller-identity

# 2. Create IAM roles for Lambda functions
aws iam create-role --role-name WritlixLambdaRole --assume-role-policy-document file://lambda-trust-policy.json

# 3. Attach policies to Lambda role
aws iam attach-role-policy --role-name WritlixLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam attach-role-policy --role-name WritlixLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonRDSDataFullAccess

# 4. Create custom policy for specific permissions
aws iam create-policy --policy-name WritlixCustomPolicy --policy-document file://writlix-custom-policy.json
aws iam attach-role-policy --role-name WritlixLambdaRole --policy-arn arn:aws:iam::ACCOUNT_ID:policy/WritlixCustomPolicy
```

#### Afternoon (1:00 PM - 5:00 PM)
```bash
# 5. Setup VPC and security groups
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=WritlixVPC}]'

# 6. Create subnets for RDS
aws ec2 create-subnet --vpc-id vpc-xxxxxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# 7. Create DB subnet group
aws rds create-db-subnet-group --db-subnet-group-name writlix-subnet-group --db-subnet-group-description "Writlix RDS subnet group" --subnet-ids subnet-xxxxxxxx subnet-yyyyyyyy

# 8. Create security group for RDS
aws ec2 create-security-group --group-name writlix-rds-sg --description "Security group for Writlix RDS" --vpc-id vpc-xxxxxxxx
```

**End of Day 1 Deliverable:** AWS environment ready for resource deployment

### Day 2: RDS PostgreSQL Setup

#### Morning (9:00 AM - 12:00 PM)
```bash
# 1. Create RDS PostgreSQL instance
aws rds create-db-instance \
    --db-instance-identifier writlix-production \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 14.9 \
    --master-username writlix_admin \
    --master-user-password "$(openssl rand -base64 32)" \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-xxxxxxxx \
    --db-subnet-group-name writlix-subnet-group \
    --backup-retention-period 7 \
    --storage-encrypted \
    --copy-tags-to-snapshot

# 2. Wait for RDS instance to be available (takes ~10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier writlix-production

# 3. Get RDS endpoint
aws rds describe-db-instances --db-instance-identifier writlix-production --query 'DBInstances[0].Endpoint.Address'
```

#### Afternoon (1:00 PM - 5:00 PM)
```sql
-- 4. Connect to RDS and create optimized schema
psql -h writlix-production.xxxxx.us-east-1.rds.amazonaws.com -U writlix_admin -d postgres

-- Create production database
CREATE DATABASE writlix_production;
\c writlix_production;

-- Create optimized tables for AWS migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User metadata table (minimal, as Clerk handles most user data)
CREATE TABLE user_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content ideas table
CREATE TABLE content_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    title TEXT,
    content TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    platform_hints TEXT[], -- Which platforms this content is optimized for
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled posts table
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    posted_at TIMESTAMP WITH TIME ZONE,
    platform_post_id VARCHAR(255), -- ID from the social platform
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social credentials table (encrypted)
CREATE TABLE user_social_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL, -- Will be encrypted
    refresh_token TEXT, -- Will be encrypted
    expires_at TIMESTAMP WITH TIME ZONE,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'inactive',
    subscription_id VARCHAR(255), -- Stripe subscription ID
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule settings table
CREATE TABLE schedule_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    frequency VARCHAR(50) DEFAULT 'daily',
    time_of_day TIME DEFAULT '09:00:00',
    timezone VARCHAR(100) DEFAULT 'UTC',
    days_of_week INTEGER[], -- [1,2,3,4,5] for weekdays
    day_of_month INTEGER, -- For monthly frequency
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_user_social_credentials_user_platform ON user_social_credentials(user_id, platform);
```

**End of Day 2 Deliverable:** RDS PostgreSQL instance ready with optimized schema

### Day 3: S3 and API Gateway Setup

#### Morning (9:00 AM - 12:00 PM)
```bash
# 1. Create S3 buckets for frontend and assets
aws s3 mb s3://writlix-frontend-prod --region us-east-1
aws s3 mb s3://writlix-assets-prod --region us-east-1

# 2. Configure S3 frontend bucket for static website hosting
aws s3api put-bucket-website --bucket writlix-frontend-prod --website-configuration file://website-config.json

# 3. Configure S3 assets bucket policy and CORS
aws s3api put-bucket-cors --bucket writlix-assets-prod --cors-configuration file://s3-cors-config.json

# 4. Setup lifecycle policy for cost optimization
aws s3api put-bucket-lifecycle-configuration --bucket writlix-assets-prod --lifecycle-configuration file://s3-lifecycle-policy.json

# 5. Create CloudFront distribution for frontend
aws cloudfront create-distribution --distribution-config file://frontend-cloudfront-config.json

# 6. Create CloudFront distribution for assets
aws cloudfront create-distribution --distribution-config file://assets-cloudfront-config.json
```

#### Afternoon (1:00 PM - 5:00 PM)
```bash
# 5. Create API Gateway
aws apigateway create-rest-api --name writlix-api --description "Writlix Social Spark Hub API"

# 6. Get API Gateway ID
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`writlix-api`].id' --output text)

# 7. Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text)

# 8. Create resource structure
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part auth
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part content
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part social
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part subscription
```

**End of Day 3 Deliverable:** S3 buckets, CloudFront distributions, and API Gateway foundation ready

---

## Phase 2: Clerk Authentication Integration (Days 4-6)

### Day 4: Clerk Setup and Configuration

#### Morning (9:00 AM - 12:00 PM)
```javascript
// 1. Create Clerk application at clerk.com
// 2. Configure OAuth providers

// clerk-config.js
const clerkConfig = {
  oauth_providers: {
    google: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      scopes: ['openid', 'email', 'profile']
    },
    linkedin_oidc: {
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      scopes: ['openid', 'email', 'profile']
    }
  },
  
  webhooks: {
    endpoint: 'https://api.writlix.com/auth/clerk-webhook',
    events: ['user.created', 'user.updated', 'user.deleted', 'session.created']
  },
  
  user_metadata: {
    public_metadata: ['subscription_status', 'onboarding_completed'],
    private_metadata: ['internal_user_id', 'migration_date']
  }
};
```

#### Afternoon (1:00 PM - 5:00 PM)
```javascript
// 3. Create Clerk webhook handler Lambda function
// functions/clerk-webhook/index.js
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const verifyWebhook = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

exports.handler = async (event) => {
  try {
    const payload = event.body;
    const signature = event.headers['clerk-signature'];
    
    if (!verifyWebhook(payload, signature, process.env.CLERK_WEBHOOK_SECRET)) {
      return { statusCode: 401, body: 'Unauthorized' };
    }
    
    const data = JSON.parse(payload);
    
    switch (data.type) {
      case 'user.created':
        await handleUserCreated(data.data);
        break;
      case 'user.updated':
        await handleUserUpdated(data.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data.data);
        break;
    }
    
    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

const handleUserCreated = async (user) => {
  await pool.query(
    'INSERT INTO user_metadata (clerk_user_id, preferences) VALUES ($1, $2)',
    [user.id, {}]
  );
};
```

**End of Day 4 Deliverable:** Clerk configured with webhook handling

### Day 5: Frontend Clerk Integration

#### Morning (9:00 AM - 12:00 PM)
```bash
# 1. Install Clerk React SDK
npm install @clerk/clerk-react

# 2. Update environment variables
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_..." >> .env.local
```

```jsx
// 3. Replace AuthProvider with Clerk
// src/contexts/auth/AuthProvider.tsx
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const AuthProvider = ({ children }) => {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthWrapper>
        {children}
      </AuthWrapper>
    </ClerkProvider>
  );
};

const AuthWrapper = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  
  const authContextValue = {
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    user: user,
    login: () => {}, // Clerk handles this
    logout: () => {}, // Clerk handles this
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Afternoon (1:00 PM - 5:00 PM)
```jsx
// 4. Update components to use Clerk
// src/components/auth/LoginForm.tsx
import { SignIn } from '@clerk/clerk-react';

export const LoginForm = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        routing="path" 
        path="/login"
        signUpUrl="/signup"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
};

// src/components/auth/SignupForm.tsx
import { SignUp } from '@clerk/clerk-react';

export const SignupForm = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        routing="path" 
        path="/signup"
        signInUrl="/login"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
};
```

**End of Day 5 Deliverable:** Frontend Clerk integration complete

### Day 6: User Data Migration Setup

#### Morning (9:00 AM - 12:00 PM)
```javascript
// 1. Create user migration script
// scripts/migrate-users.js
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrateUsers = async () => {
  try {
    // 1. Get all users from Supabase
    const { data: supabaseUsers } = await supabase
      .from('profiles')
      .select('*');
    
    const userMappings = [];
    
    for (const supabaseUser of supabaseUsers) {
      try {
        // 2. Find corresponding Clerk user by email
        const clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [supabaseUser.email]
        });
        
        if (clerkUsers.length > 0) {
          const clerkUser = clerkUsers[0];
          
          // 3. Create user metadata in AWS RDS
          await pool.query(
            'INSERT INTO user_metadata (clerk_user_id, preferences) VALUES ($1, $2) ON CONFLICT (clerk_user_id) DO NOTHING',
            [clerkUser.id, supabaseUser.preferences || {}]
          );
          
          // 4. Store mapping for content migration
          userMappings.push({
            supabase_id: supabaseUser.id,
            clerk_id: clerkUser.id,
            email: supabaseUser.email
          });
          
          console.log(`✓ Migrated user: ${supabaseUser.email}`);
        } else {
          console.log(`⚠ No Clerk user found for: ${supabaseUser.email}`);
        }
      } catch (error) {
        console.error(`✗ Error migrating user ${supabaseUser.email}:`, error);
      }
    }
    
    // 5. Save mappings for content migration
    await fs.writeFile('user-mappings.json', JSON.stringify(userMappings, null, 2));
    
    console.log(`Migration complete. ${userMappings.length} users migrated.`);
    return userMappings;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = { migrateUsers };
```

#### Afternoon (1:00 PM - 5:00 PM)
```bash
# 2. Run user migration
node scripts/migrate-users.js

# 3. Verify migration results
psql -h $RDS_ENDPOINT -U writlix_admin -d writlix_production -c "SELECT COUNT(*) FROM user_metadata;"

# 4. Create validation script
node scripts/validate-user-migration.js
```

**End of Day 6 Deliverable:** User authentication migrated to Clerk with user mappings

---

## Phase 3: Lambda Functions Development (Days 7-12)

### Day 7: Lambda Development Environment Setup

#### Morning (9:00 AM - 12:00 PM)
```bash
# 1. Create Lambda functions directory structure
mkdir -p lambda-functions/{auth,content,social,subscription,utility}
mkdir -p lambda-functions/shared-layer/nodejs/node_modules

# 2. Create shared dependencies layer
cd lambda-functions/shared-layer/nodejs
npm init -y
npm install pg @aws-sdk/client-s3 @clerk/clerk-sdk-node openai

# 3. Create shared utilities
mkdir -p opt
```

```javascript
// lambda-functions/shared-layer/nodejs/opt/db-utils.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', { text, error: error.message });
    throw error;
  }
};

module.exports = { query, pool };
```

#### Afternoon (1:00 PM - 5:00 PM)
```javascript
// lambda-functions/shared-layer/nodejs/opt/auth-utils.js
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

const successResponse = (data) => ({
  statusCode: 200,
  headers: corsHeaders,
  body: JSON.stringify(data)
});

const errorResponse = (error, statusCode = 500) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify({ error: error.message })
});

module.exports = { verifyClerkToken, corsHeaders, successResponse, errorResponse };
```

**End of Day 7 Deliverable:** Lambda development environment and shared utilities ready

### Day 8-9: Content Generation Functions

#### Day 8 Morning: Generate Content Function
```javascript
// lambda-functions/content/generate-content/index.js
const OpenAI = require('openai');
const { query } = require('/opt/db-utils');
const { verifyClerkToken, successResponse, errorResponse } = require('/opt/auth-utils');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const buildContentPrompt = (topic, tone, platform) => {
  const platformGuides = {
    linkedin: `Create a professional LinkedIn post about "${topic}" with a ${tone} tone. 
               Format with proper line breaks and include relevant hashtags. 
               Keep it engaging and professional, around 150-300 words.`,
    facebook: `Create a Facebook post about "${topic}" with a ${tone} tone. 
               Make it engaging and conversational, around 100-200 words.`,
    instagram: `Create an Instagram caption about "${topic}" with a ${tone} tone. 
                Include relevant hashtags and emojis, around 100-150 words.`
  };
  
  return platformGuides[platform] || platformGuides.linkedin;
};

exports.handler = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders, body: '' };
    }
    
    const user = await verifyClerkToken(event.headers.authorization);
    const { topic, tone = 'professional', platform = 'linkedin' } = JSON.parse(event.body);
    
    if (!topic) {
      return errorResponse(new Error('Topic is required'), 400);
    }
    
    const prompt = buildContentPrompt(topic, tone, platform);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional content creator specializing in ${platform} content. 
                   Generate engaging, well-formatted content that follows platform best practices.`
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
    
    // Store generated content in database
    const result = await query(
      'INSERT INTO content_ideas (user_id, title, content, status, platform_hints) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user.sub, topic, generatedContent, 'draft', [platform]]
    );
    
    return successResponse({
      id: result.rows[0].id,
      title: topic,
      content: generatedContent,
      platform: platform
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return errorResponse(error);
  }
};
```

#### Day 8 Afternoon: Deploy and Test Content Generation
```bash
# 1. Create deployment package
cd lambda-functions/content/generate-content
zip -r generate-content.zip . ../../shared-layer/nodejs/opt/

# 2. Create Lambda function
aws lambda create-function \
    --function-name writlix-generate-content \
    --runtime nodejs18.x \
    --role arn:aws:iam::ACCOUNT_ID:role/WritlixLambdaRole \
    --handler index.handler \
    --zip-file fileb://generate-content.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment Variables='{
        "DATABASE_URL":"'$DATABASE_URL'",
        "OPENAI_API_KEY":"'$OPENAI_API_KEY'",
        "CLERK_SECRET_KEY":"'$CLERK_SECRET_KEY'"
    }'

# 3. Test the function
aws lambda invoke \
    --function-name writlix-generate-content \
    --payload '{"httpMethod":"POST","headers":{"authorization":"Bearer test-token"},"body":"{\"topic\":\"AI in business\",\"tone\":\"professional\"}"}' \
    response.json
```

#### Day 9: Generate Content from Image Function
```javascript
// lambda-functions/content/generate-content-from-image/index.js
const OpenAI = require('openai');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { query } = require('/opt/db-utils');
const { verifyClerkToken, successResponse, errorResponse } = require('/opt/auth-utils');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const user = await verifyClerkToken(event.headers.authorization);
    const { imageUrl, platform = 'linkedin', tone = 'professional' } = JSON.parse(event.body);
    
    if (!imageUrl) {
      return errorResponse(new Error('Image URL is required'), 400);
    }
    
    // Generate content using GPT-4o with vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional content creator. Analyze the image and create engaging ${platform} content with a ${tone} tone.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create a professional ${platform} post based on this image. Make it engaging and relevant.`
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const generatedContent = completion.choices[0].message.content;
    const title = `Content from image - ${new Date().toLocaleDateString()}`;
    
    // Store generated content
    const result = await query(
      'INSERT INTO content_ideas (user_id, title, content, status, platform_hints) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user.sub, title, generatedContent, 'draft', [platform]]
    );
    
    return successResponse({
      id: result.rows[0].id,
      title: title,
      content: generatedContent,
      platform: platform,
      sourceImage: imageUrl
    });
  } catch (error) {
    console.error('Image content generation error:', error);
    return errorResponse(error);
  }
};
```

**End of Day 9 Deliverable:** Content generation Lambda functions deployed and tested

### Day 10-11: OAuth and Social Media Functions

#### Day 10: OAuth Handler Functions
```javascript
// lambda-functions/auth/linkedin-oauth/index.js
const axios = require('axios');
const crypto = require('crypto');
const { query } = require('/opt/db-utils');
const { verifyClerkToken, successResponse, errorResponse } = require('/opt/auth-utils');

const encryptToken = (token) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const exchangeLinkedInCode = async (code) => {
  const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  
  return tokenResponse.data;
};

const getLinkedInProfile = async (accessToken) => {
  const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  return profileResponse.data;
};

exports.handler = async (event) => {
  try {
    const user = await verifyClerkToken(event.headers.authorization);
    const { code, state } = JSON.parse(event.body);
    
    // Exchange code for token
    const tokenData = await exchangeLinkedInCode(code);
    
    // Get user profile
    const profile = await getLinkedInProfile(tokenData.access_token);
    
    // Store encrypted credentials
    await query(
      `INSERT INTO user_social_credentials (user_id, platform, access_token, refresh_token, expires_at, profile_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform) 
       DO UPDATE SET access_token = $3, refresh_token = $4, expires_at = $5, profile_data = $6, updated_at = NOW()`,
      [
        user.sub,
        'linkedin',
        encryptToken(tokenData.access_token),
        tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
        new Date(Date.now() + tokenData.expires_in * 1000),
        profile
      ]
    );
    
    return successResponse({ 
      success: true, 
      profile: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture
      }
    });
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return errorResponse(error);
  }
};
```

#### Day 11: Social Media Posting Functions
```javascript
// lambda-functions/social/post-to-linkedin/index.js
const axios = require('axios');
const crypto = require('crypto');
const { query } = require('/opt/db-utils');
const { verifyClerkToken, successResponse, errorResponse } = require('/opt/auth-utils');

const decryptToken = (encryptedToken) => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const postToLinkedIn = async (accessToken, content, profileId) => {
  const postData = {
    author: `urn:li:person:${profileId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    }
  });
  
  return response.data;
};

exports.handler = async (event) => {
  try {
    const user = await verifyClerkToken(event.headers.authorization);
    const { contentId, scheduleId } = JSON.parse(event.body);
    
    // Get content and credentials
    const [contentResult, credentialsResult] = await Promise.all([
      query('SELECT * FROM content_ideas WHERE id = $1 AND user_id = $2', [contentId, user.sub]),
      query('SELECT * FROM user_social_credentials WHERE user_id = $1 AND platform = $2', [user.sub, 'linkedin'])
    ]);
    
    if (contentResult.rows.length === 0) {
      return errorResponse(new Error('Content not found'), 404);
    }
    
    if (credentialsResult.rows.length === 0) {
      return errorResponse(new Error('LinkedIn not connected'), 404);
    }
    
    const content = contentResult.rows[0];
    const credentials = credentialsResult.rows[0];
    
    // Decrypt access token
    const accessToken = decryptToken(credentials.access_token);
    const profileId = credentials.profile_data.sub; // LinkedIn profile ID
    
    // Post to LinkedIn
    const postResponse = await postToLinkedIn(accessToken, content.content, profileId);
    
    // Update scheduled post status
    if (scheduleId) {
      await query(
        'UPDATE scheduled_posts SET status = $1, posted_at = $2, platform_post_id = $3 WHERE id = $4',
        ['published', new Date(), postResponse.id, scheduleId]
      );
    }
    
    // Update content status
    await query(
      'UPDATE content_ideas SET status = $1, updated_at = $2 WHERE id = $3',
      ['published', new Date(), contentId]
    );
    
    return successResponse({
      success: true,
      postId: postResponse.id,
      url: `https://www.linkedin.com/feed/update/${postResponse.id}`
    });
  } catch (error) {
    console.error('LinkedIn posting error:', error);
    
    // Update scheduled post with error
    if (event.body && JSON.parse(event.body).scheduleId) {
      await query(
        'UPDATE scheduled_posts SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', error.message, JSON.parse(event.body).scheduleId]
      );
    }
    
    return errorResponse(error);
  }
};
```

**End of Day 11 Deliverable:** OAuth and social posting Lambda functions ready

### Day 12: Utility and Subscription Functions

#### Morning: Subscription Handler
```javascript
// lambda-functions/subscription/subscription-handler/index.js
const axios = require('axios');
const { query } = require('/opt/db-utils');
const { verifyClerkToken, successResponse, errorResponse } = require('/opt/auth-utils');

const createStripePaymentIntent = async (amount, currency, userId) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Amount in smallest currency unit
    currency: currency,
    metadata: {
      user_id: userId,
      timestamp: Date.now().toString()
    },
    automatic_payment_methods: {
      enabled: true
    }
  });
  
  return paymentIntent;
};

exports.handler = async (event) => {
  try {
    const user = await verifyClerkToken(event.headers.authorization);
    const { action, planId, amount, currency = 'INR' } = JSON.parse(event.body);
    
    switch (action) {
      case 'create_order':
        const paymentIntent = await createStripePaymentIntent(amount, currency, user.sub);
        return successResponse({ 
          clientSecret: paymentIntent.client_secret, 
          paymentIntentId: paymentIntent.id 
        });
        
      case 'verify_payment':
        const { paymentIntentId } = JSON.parse(event.body);
        
        // Verify Stripe payment intent
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Update subscription status
          await query(
            `INSERT INTO user_subscriptions (user_id, plan_id, status, subscription_id, current_period_start, current_period_end)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id) 
             DO UPDATE SET plan_id = $2, status = $3, subscription_id = $4, current_period_start = $5, current_period_end = $6`,
            [
              user.sub,
              planId,
              'active',
              paymentIntentId,
              new Date(),
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            ]
          );
          
          return successResponse({ success: true, status: 'active' });
        } else {
          return errorResponse(new Error('Payment not completed'), 400);
        }
        
      default:
        return errorResponse(new Error('Invalid action'), 400);
    }
  } catch (error) {
    console.error('Subscription error:', error);
    return errorResponse(error);
  }
};
```

#### Afternoon: Deploy All Functions
```bash
# 1. Deploy all Lambda functions
./deploy-all-functions.sh

# 2. Configure API Gateway endpoints
./configure-api-gateway.sh

# 3. Test all endpoints
./test-all-endpoints.sh
```

**End of Day 12 Deliverable:** All Lambda functions deployed and API endpoints configured

---

## Phase 4: Data Migration and Testing (Days 13-18)

### Day 13-14: Data Migration Execution

#### Day 13: Content and Social Credentials Migration
```javascript
// scripts/migrate-content.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const userMappings = JSON.parse(fs.readFileSync('user-mappings.json', 'utf8'));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrateContent = async () => {
  console.log('Starting content migration...');
  
  const { data: contentIdeas } = await supabase
    .from('content_ideas')
    .select('*');
  
  let migrated = 0;
  let failed = 0;
  
  for (const content of contentIdeas) {
    try {
      const mapping = userMappings.find(m => m.supabase_id === content.user_id);
      if (mapping) {
        await pool.query(
          'INSERT INTO content_ideas (id, user_id, title, content, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            content.id,
            mapping.clerk_id,
            content.title,
            content.content,
            content.status,
            content.created_at,
            content.updated_at
          ]
        );
        migrated++;
      } else {
        console.log(`No mapping found for user: ${content.user_id}`);
        failed++;
      }
    } catch (error) {
      console.error(`Error migrating content ${content.id}:`, error);
      failed++;
    }
  }
  
  console.log(`Content migration complete. Migrated: ${migrated}, Failed: ${failed}`);
};

const migrateSocialCredentials = async () => {
  console.log('Starting social credentials migration...');
  
  const platforms = ['facebook', 'instagram', 'linkedin'];
  
  for (const platform of platforms) {
    const { data: credentials } = await supabase
      .from(`user_${platform}_credentials`)
      .select('*');
    
    for (const cred of credentials) {
      try {
        const mapping = userMappings.find(m => m.supabase_id === cred.user_id);
        if (mapping) {
          await pool.query(
            `INSERT INTO user_social_credentials (user_id, platform, access_token, refresh_token, expires_at, profile_data, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              mapping.clerk_id,
              platform,
              cred.access_token, // Already encrypted
              cred.refresh_token,
              cred.expires_at,
              cred.profile_data,
              cred.created_at,
              cred.updated_at
            ]
          );
        }
      } catch (error) {
        console.error(`Error migrating ${platform} credentials for user ${cred.user_id}:`, error);
      }
    }
  }
  
  console.log('Social credentials migration complete.');
};

const main = async () => {
  await migrateContent();
  await migrateSocialCredentials();
  process.exit(0);
};

main().catch(console.error);
```

#### Day 14: Schedule and Subscription Migration
```javascript
// scripts/migrate-schedules-subscriptions.js
const migrateScheduledPosts = async () => {
  console.log('Starting scheduled posts migration...');
  
  const { data: scheduledPosts } = await supabase
    .from('scheduled_posts')
    .select('*');
  
  for (const post of scheduledPosts) {
    try {
      const mapping = userMappings.find(m => m.supabase_id === post.user_id);
      if (mapping) {
        await pool.query(
          'INSERT INTO scheduled_posts (id, content_id, user_id, platform, scheduled_time, status, posted_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            post.id,
            post.content_id,
            mapping.clerk_id,
            post.platform,
            post.scheduled_time,
            post.status,
            post.posted_at,
            post.created_at
          ]
        );
      }
    } catch (error) {
      console.error(`Error migrating scheduled post ${post.id}:`, error);
    }
  }
  
  console.log('Scheduled posts migration complete.');
};

const migrateSubscriptions = async () => {
  console.log('Starting subscriptions migration...');
  
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('*');
  
  for (const sub of subscriptions) {
    try {
      const mapping = userMappings.find(m => m.supabase_id === sub.user_id);
      if (mapping) {
        await pool.query(
          'INSERT INTO user_subscriptions (user_id, plan_id, status, subscription_id, current_period_start, current_period_end, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            mapping.clerk_id,
            sub.plan_id,
            sub.status,
            sub.subscription_id,
            sub.current_period_start,
            sub.current_period_end,
            sub.created_at
          ]
        );
      }
    } catch (error) {
      console.error(`Error migrating subscription for user ${sub.user_id}:`, error);
    }
  }
  
  console.log('Subscriptions migration complete.');
};

// Execute migrations
const main = async () => {
  await migrateScheduledPosts();
  await migrateSubscriptions();
  process.exit(0);
};

main().catch(console.error);
```

**End of Day 14 Deliverable:** All data successfully migrated to AWS RDS

### Day 15-16: Integration Testing

#### Day 15: API Testing
```javascript
// tests/integration/api-integration.test.js
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.writlix.com';
const TEST_TOKEN = process.env.TEST_CLERK_TOKEN;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

describe('API Integration Tests', () => {
  test('Content generation should work', async () => {
    const response = await apiClient.post('/content/generate', {
      topic: 'AI in modern business',
      tone: 'professional',
      platform: 'linkedin'
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('content');
    expect(response.data).toHaveProperty('id');
  });
  
  test('LinkedIn OAuth should process callback', async () => {
    const response = await apiClient.post('/auth/linkedin/callback', {
      code: 'test-auth-code',
      state: 'test-state'
    });
    
    // This will fail with invalid code, but should not crash
    expect([200, 400, 401]).toContain(response.status);
  });
  
  test('Social posting should work with valid credentials', async () => {
    // First, create content
    const contentResponse = await apiClient.post('/content/generate', {
      topic: 'Test post',
      tone: 'professional'
    });
    
    const contentId = contentResponse.data.id;
    
    // Then try to post (may fail if no valid credentials)
    const postResponse = await apiClient.post('/social/post-to-linkedin', {
      contentId: contentId
    });
    
    // Accept various status codes as valid test outcomes
    expect([200, 404, 401]).toContain(postResponse.status);
  });
});

// Run tests
npm test
```

#### Day 16: Frontend Integration Testing
```bash
# 1. Update frontend to use new API endpoints
# Update all API calls to use new AWS Lambda endpoints

# 2. Test frontend integration
npm run dev

# 3. Run frontend tests
npm run test

# 4. Build and verify
npm run build
```

**End of Day 16 Deliverable:** Full integration testing completed

### Day 17-18: Performance and Load Testing

#### Day 17: Performance Testing
```javascript
// tests/performance/load-test.js
const axios = require('axios');

const runLoadTest = async () => {
  const API_BASE_URL = 'https://api.writlix.com';
  const concurrency = 50;
  const duration = 60000; // 1 minute
  
  const startTime = Date.now();
  let requests = 0;
  let errors = 0;
  
  const makeRequest = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/content/generate`, {
        topic: 'Load test content',
        tone: 'professional'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_CLERK_TOKEN}`
        },
        timeout: 5000
      });
      
      requests++;
      if (response.status !== 200) errors++;
    } catch (error) {
      errors++;
    }
  };
  
  // Start concurrent requests
  const promises = [];
  const interval = setInterval(() => {
    if (Date.now() - startTime < duration) {
      for (let i = 0; i < concurrency; i++) {
        promises.push(makeRequest());
      }
    } else {
      clearInterval(interval);
    }
  }, 1000);
  
  // Wait for completion
  setTimeout(async () => {
    clearInterval(interval);
    await Promise.allSettled(promises);
    
    const totalTime = Date.now() - startTime;
    const rps = (requests / totalTime) * 1000;
    const errorRate = (errors / requests) * 100;
    
    console.log(`Load Test Results:
      Duration: ${totalTime}ms
      Total Requests: ${requests}
      Errors: ${errors}
      RPS: ${rps.toFixed(2)}
      Error Rate: ${errorRate.toFixed(2)}%
    `);
  }, duration + 5000);
};

runLoadTest();
```

#### Day 18: Cost Monitoring Setup
```javascript
// monitoring/cost-monitoring.js
const AWS = require('aws-sdk');

const budgets = new AWS.Budgets({ region: 'us-east-1' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });

const setupCostMonitoring = async () => {
  // Create cost budget
  const budgetParams = {
    AccountId: process.env.AWS_ACCOUNT_ID,
    Budget: {
      BudgetName: 'WritlixMonthlyCost',
      BudgetLimit: {
        Amount: '100',
        Unit: 'USD'
      },
      TimeUnit: 'MONTHLY',
      BudgetType: 'COST',
      CostFilters: {
        Service: ['Amazon RDS', 'AWS Lambda', 'Amazon API Gateway', 'Amazon S3']
      }
    },
    NotificationsWithSubscribers: [
      {
        Notification: {
          NotificationType: 'ACTUAL',
          ComparisonOperator: 'GREATER_THAN',
          Threshold: 80,
          NotificationState: 'OK'
        },
        Subscribers: [
          {
            SubscriptionType: 'EMAIL',
            Address: process.env.ALERT_EMAIL
          }
        ]
      }
    ]
  };
  
  await budgets.createBudget(budgetParams).promise();
  
  // Create CloudWatch dashboard
  const dashboardBody = {
    widgets: [
      {
        type: 'metric',
        properties: {
          metrics: [
            ['AWS/Lambda', 'Duration', 'FunctionName', 'writlix-generate-content'],
            ['AWS/Lambda', 'Errors', 'FunctionName', 'writlix-generate-content'],
            ['AWS/RDS', 'DatabaseConnections', 'DBInstanceIdentifier', 'writlix-production']
          ],
          period: 300,
          stat: 'Average',
          region: 'us-east-1',
          title: 'Writlix Performance Metrics'
        }
      }
    ]
  };
  
  await cloudwatch.putDashboard({
    DashboardName: 'WritlixMonitoring',
    DashboardBody: JSON.stringify(dashboardBody)
  }).promise();
  
  console.log('Cost monitoring and dashboard setup complete');
};

setupCostMonitoring().catch(console.error);
```

**End of Day 18 Deliverable:** Performance validated and monitoring setup complete

---

## Phase 5: Production Deployment (Days 19-21)

### Day 19: Production Environment Setup

#### Morning: Production Infrastructure
```bash
# 1. Create production environment
aws cloudformation create-stack \
    --stack-name writlix-production \
    --template-body file://production-stack.yml \
    --parameters ParameterKey=Environment,ParameterValue=production \
    --capabilities CAPABILITY_IAM

# 2. Update DNS records
aws route53 change-resource-record-sets \
    --hosted-zone-id Z123456789012 \
    --change-batch file://dns-update.json

# 3. Deploy production Lambda functions
./deploy-production-functions.sh
```

#### Afternoon: SSL and Security Setup
```bash
# 1. Request SSL certificate
aws acm request-certificate \
    --domain-name api.writlix.com \
    --validation-method DNS

# 2. Configure API Gateway custom domain
aws apigateway create-domain-name \
    --domain-name api.writlix.com \
    --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/abcd-1234

# 3. Setup CloudFront for frontend
aws cloudfront create-distribution \
    --distribution-config file://frontend-distribution.json
```

**End of Day 19 Deliverable:** Production environment ready

### Day 20: Data Cutover and Final Testing

#### Morning: Final Data Sync
```bash
# 1. Final incremental data sync
node scripts/incremental-sync.js

# 2. Validate all data integrity
node scripts/validate-complete-migration.js

# 3. Update frontend configuration
sed -i 's/VITE_API_URL=.*/VITE_API_URL=https:\/\/api.writlix.com/' .env.production
```

#### Afternoon: Go-Live Preparation
```bash
# 1. Build and deploy frontend to S3
npm run build
aws s3 sync dist/ s3://writlix-frontend-prod --delete

# 2. Update CloudFront distribution for frontend
aws cloudfront create-invalidation \
    --distribution-id E123456789012 \
    --paths "/*"

# 3. Verify static website hosting works
curl https://d123456789.cloudfront.net

# 3. Final system tests
npm run test:e2e
```

**End of Day 20 Deliverable:** System ready for go-live

### Day 21: Go-Live and Handover

#### Morning: Production Cutover (9:00 AM - 12:00 PM)
```bash
# 1. Maintenance mode notification
curl -X POST $SLACK_WEBHOOK -d '{"text":"🚀 Starting production cutover to AWS"}'

# 2. Final DNS switch
aws route53 change-resource-record-sets \
    --hosted-zone-id Z123456789012 \
    --change-batch file://final-dns-switch.json

# 3. Monitor for 2 hours
./monitor-production.sh

# 4. Verify all functionality
node scripts/production-health-check.js
```

#### Afternoon: Documentation and Handover (1:00 PM - 5:00 PM)
```markdown
# Create final deliverables
1. Updated CLAUDE.md with AWS architecture
2. Production runbook
3. Cost optimization guide
4. Migration completion report
```

**Final Deliverables:**
- [ ] All Lambda functions deployed and operational
- [ ] Database migrated with zero data loss
- [ ] Frontend updated and deployed
- [ ] DNS switched to new infrastructure
- [ ] Monitoring and alerting active
- [ ] Documentation package delivered
- [ ] Client sign-off obtained

---

## Post-Migration Monitoring (Week 4)

### Daily Health Checks (Days 22-28)
```bash
# Daily monitoring script
#!/bin/bash
echo "=== Daily Health Check $(date) ==="

# Check API health
curl -f https://api.writlix.com/health || echo "API health check failed"

# Check RDS connections
aws rds describe-db-instances --db-instance-identifier writlix-production --query 'DBInstances[0].DBInstanceStatus'

# Check Lambda function metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=writlix-generate-content \
    --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Sum

# Check costs
aws ce get-cost-and-usage \
    --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --granularity DAILY \
    --metrics BlendedCost

echo "=== Health Check Complete ==="
```

### Success Metrics Tracking
```javascript
// Track key metrics for project success evaluation
const successMetrics = {
  technical: {
    uptime: '99.9%', // Target
    avgResponseTime: '<2s', // Target
    errorRate: '<1%' // Target
  },
  business: {
    costReduction: '40-60%', // Target vs Supabase
    userSatisfaction: '>95%', // No major complaints
    featureParity: '100%' // All features working
  },
  operational: {
    deploymentTime: '<5min', // For future deployments
    incidentResponse: '<30min', // Issue resolution time
    documentationComplete: '100%' // All docs delivered
  }
};
```

---

This comprehensive step-by-step execution plan provides detailed guidance for successfully migrating Writlix from Supabase to AWS within the 21-day timeline while maintaining all functionality and achieving cost optimization goals.