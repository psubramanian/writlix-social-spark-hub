# Statement of Work
## Supabase to AWS Migration for Writlix Social Spark Hub

**Date:** January 11, 2025  
**Client:** Writlix Social Spark Hub  
**Contractor:** [Your Company Name]  
**Project Value:** $500.00  

---

## 1. Project Overview

This Statement of Work outlines the migration of Writlix Social Spark Hub from Supabase to AWS infrastructure, implementing Clerk for authentication, and optimizing for cost-effectiveness while maintaining scalability.

### Current State
- React frontend with Supabase backend
- Supabase Auth with OAuth integrations
- 15+ Edge Functions handling business logic
- PostgreSQL database with complex user and content management
- Integrated social media posting (Facebook, Instagram, LinkedIn)
- AI-powered content generation via OpenAI

### Desired State
- Static React frontend with AWS infrastructure
- Clerk authentication with B2C and OAuth support
- AWS Lambda functions replacing Supabase Edge Functions
- Optimized database schema with reduced redundancy
- S3 storage for AI-generated images
- Cost-effective architecture under $100/month

---

## 2. Scope of Work

### 2.1 Authentication Migration
- **Clerk Integration:** Replace Supabase Auth with Clerk authentication
- **OAuth Configuration:** Migrate social media OAuth flows (Google, LinkedIn, Facebook, Instagram)
- **User Data Migration:** Preserve essential user preferences and settings
- **Session Management:** Implement secure session handling

### 2.2 Backend Infrastructure Migration
- **AWS Lambda Functions:** Convert 15 Supabase Edge Functions to AWS Lambda
  - OAuth callback handlers (Facebook, Instagram, LinkedIn)
  - Content generation functions (AI integration)
  - Social media posting functions
  - Subscription management
- **Database Optimization:** Streamline schema to reduce storage costs
- **API Gateway:** Configure AWS API Gateway for function orchestration

### 2.3 Data Storage Migration
- **Database Migration:** Migrate essential data to AWS RDS (PostgreSQL)
- **S3 Storage:** Implement S3 bucket for AI-generated image storage
- **Data Cleanup:** Remove Clerk-redundant tables and optimize storage

### 2.4 Integration Preservation
- **External APIs:** Maintain integrations with:
  - OpenAI (GPT-4o-mini for content generation)
  - Social Media APIs (Facebook Graph, Instagram, LinkedIn)
  - Stripe payment processing
  - Google reCAPTCHA
- **Business Logic:** Preserve all current functionality

---

## 3. Deliverables

### 3.1 Technical Deliverables
1. **AWS Infrastructure Setup**
   - Lambda functions deployment
   - RDS database configuration
   - S3 buckets setup (frontend hosting + asset storage)
   - CloudFront CDN distribution
   - API Gateway configuration

2. **Authentication System**
   - Clerk integration with OAuth providers
   - User data migration scripts
   - Session management implementation

3. **Data Migration**
   - Database schema optimization
   - Data migration scripts
   - S3 storage configuration

4. **Frontend Deployment**
   - Static site deployment to S3
   - CloudFront CDN configuration
   - Authentication integration with Clerk
   - API endpoint updates

### 3.2 Documentation Deliverables
1. **AWS Architecture Documentation**
2. **Migration Guide**
3. **Cost Optimization Report**
4. **Deployment Instructions**

---

## 4. Timeline

**Project Duration:** 2-3 weeks  
**Start Date:** Upon SOW execution  

### Phase 1: Infrastructure Setup (Week 1)
- AWS account setup and configuration
- Clerk authentication implementation
- Basic Lambda function deployment

### Phase 2: Migration & Testing (Week 2)
- Data migration execution
- Function testing and optimization
- Integration testing

### Phase 3: Deployment & Handover (Week 3)
- Production deployment
- Documentation delivery
- Knowledge transfer

---

## 5. Cost Structure

### 5.1 Professional Services
- **Total Project Cost:** $500.00
- **Payment Terms:** 50% upfront, 50% upon completion
- **Includes:** All development, migration, testing, and documentation

### 5.2 AWS Infrastructure Costs (Client Responsibility)
- **Estimated Monthly Cost:** $45-67/month
- **Cost Optimization Target:** Under $100/month
- **Free Tier Utilization:** Maximized for first 12 months

**Detailed Cost Breakdown:**
- AWS Lambda: $0-20/month (likely free tier)
- RDS PostgreSQL: $15-25/month (db.t3.micro)
- S3 Storage: $1-3/month
- CloudFront CDN: $2-8/month
- API Gateway: $0-10/month
- CloudWatch Logs: $1-3/month

---

## 6. Success Criteria

### 6.1 Functional Requirements
- ✅ All current functionality preserved
- ✅ Authentication working with Clerk + OAuth
- ✅ Social media posting operational
- ✅ Content generation functional
- ✅ Payment processing intact

### 6.2 Performance Requirements
- ✅ Application response time ≤ current performance
- ✅ 99.9% uptime target
- ✅ Secure credential storage

### 6.3 Cost Requirements
- ✅ Monthly AWS costs under $100
- ✅ Scalable architecture for growth
- ✅ Free tier optimization

---

## 7. Assumptions & Dependencies

### 7.1 Client Responsibilities
- Provide current Supabase database access
- Create AWS account and provide access
- Create Clerk account and configure OAuth apps
- Approve architecture decisions
- Provide testing environment access

### 7.2 Technical Assumptions
- Current application is fully functional
- Database contains production data
- OAuth applications can be migrated
- No breaking changes to external APIs

### 7.3 External Dependencies
- Clerk service availability
- AWS service availability
- Third-party API stability (OpenAI, social platforms)

---

## 8. Terms & Conditions

### 8.1 Warranty
- 30-day bug fix warranty on delivered code
- Excludes third-party service issues
- Excludes infrastructure cost overruns

### 8.2 Intellectual Property
- Client retains all rights to application code
- Contractor retains rights to general methodologies
- Open source components remain under original licenses

### 8.3 Confidentiality
- All client data and business information kept confidential
- Secure handling of credentials and tokens
- No disclosure of proprietary business logic

---

## 9. Acceptance Criteria

This project will be considered complete when:

1. **All Lambda functions deployed and tested**
2. **Clerk authentication fully operational**
3. **Data successfully migrated to AWS**
4. **All integrations functional**
5. **Documentation delivered**
6. **Client sign-off obtained**

---

**Client Signature:** _________________________ **Date:** ___________

**Contractor Signature:** _________________________ **Date:** ___________

---

*This Statement of Work constitutes the entire agreement between the parties for the described services. Any modifications must be documented in writing and signed by both parties.*