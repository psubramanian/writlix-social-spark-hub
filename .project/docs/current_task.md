# Current Task: LocalStack Frontend-Backend Integration & Schedule Management

**Branch:** aws-development

**Overall Goal:** Complete frontend migration from Supabase to LocalStack AWS services. Fix schedule settings CRUD operations and test full end-to-end functionality before deploying to production AWS.

## Current Status (June 15, 2025 - 11:41 PM):

### ✅ COMPLETED TODAY:
- [x] **Removed All Subscription Service Code:**
  - [x] Deleted subscription hooks (`useSubscription.ts`, `useSubscriptionPlan.ts`)
  - [x] Deleted subscription components and pages (`Subscription.tsx`, `/subscription/` directory)
  - [x] Removed subscription routes from `App.tsx`
  - [x] Cleaned up all subscription imports and references
  - [x] Removed newsletter popup functionality

- [x] **Fixed Frontend Hook Migration:**
  - [x] **`useScheduleSettings.ts`**: Fully migrated from Supabase to LocalStack API
    - [x] Updated `fetchUserSettings()` to use `GET /api/schedule-settings`
    - [x] Updated `updateUserSettings()` to use `PUT /api/schedule-settings`
  - [x] **`useScheduledPostsFetch.ts`**: Fully migrated from Supabase to LocalStack API
    - [x] Updated to use `GET /api/scheduled-posts` endpoint
    - [x] Added proper data transformation for DynamoDB structure

- [x] **Database Setup & Testing:**
  - [x] Verified DynamoDB table `WritlixSocialHub` exists in LocalStack
  - [x] Confirmed API endpoints work via direct curl testing
  - [x] Fixed incomplete user schedule record in database

### 🔄 IN PROGRESS:
- [ ] **Backend PUT Endpoint Bug (CRITICAL):**
  - **ISSUE**: Lambda function in LocalStack is running old code despite redeployment
  - **SYMPTOM**: PUT `/api/schedule-settings` still returns old response format, only updates `nextRunAt` field
  - **EXPECTED**: Should update all fields (`frequency`, `timeOfDay`, `timezone`, `dayOfWeek`) and return complete record
  - **STATUS**: CDK deployment succeeded but LocalStack not picking up new Lambda code

### ❌ IMMEDIATE BLOCKERS:
1. **Lambda Code Update Issue**: LocalStack still running old Lambda despite fresh deployment
2. **Frontend Environment Variable**: May need to update API Gateway URL after fresh deployment

## Database Current State:
```json
{
  "PK": "USER#user_2yVhrQ5sN1TMfQ5Ux2he41z2HXn",
  "SK": "SCHEDULE_SETTINGS#GENERAL", 
  "frequency": "daily",
  "timeOfDay": "09:00",
  "timezone": "America/Chicago",
  "nextRunAt": "2025-06-16T14:00:00.000Z",
  "userId": "user_2yVhrQ5sN1TMfQ5Ux2he41z2HXn"
}
```

## Frontend Environment:
```bash
VITE_API_BASE_URL=https://7flpdj3bgn.execute-api.localhost.localstack.cloud:4566/prod
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c3VpdGVkLXBob2VuaXgtMTAuY2xlcmsuYWNjb3VudHMuZGV2JA
```

## Testing Workflow:
1. **Current Schedule Display**: Working (shows daily 09:00 America/Chicago)
2. **Schedule Updates**: NOT WORKING (backend not updating all fields)
3. **Posts Loading**: Working (returns empty array, no errors)

## Next Session Tasks:
1. **FIX CRITICAL**: Investigate why LocalStack Lambda not updating despite CDK deployment
   - Try restarting LocalStack container
   - Verify Lambda function code is actually updated
   - Check CloudWatch logs in LocalStack
2. **Test**: Weekly Friday 11am schedule update end-to-end
3. **Test**: Frontend schedule creation/modification flows
4. **Prepare**: For AWS production deployment

## Recent File Changes:
- `backend/writlix-social-hub/api-handler/app.js`: Fixed PUT endpoint (lines 172-235)
- `frontend/src/hooks/useScheduleSettings.ts`: Migrated to LocalStack API
- `frontend/src/hooks/useScheduledPostsFetch.ts`: Migrated to LocalStack API
- `frontend/.env.local`: Updated API base URL
- `iac/lib/simple-api-stack.ts`: Increased Lambda timeout to 5 minutes

## API Endpoints Status:
- ✅ `GET /api/schedule-settings` - Working
- ✅ `GET /api/scheduled-posts` - Working  
- ❌ `PUT /api/schedule-settings` - **BROKEN** (not updating all fields)

## User Context:
- **User ID**: `user_2yVhrQ5sN1TMfQ5Ux2he41z2HXn`
- **Current Schedule**: Daily at 09:00 America/Chicago
- **Test Scenario**: Trying to update to Weekly Friday 11am