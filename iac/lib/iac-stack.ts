import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'; // Using HTTP API (v2)
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // IAM Role for Lambda Functions
    const lambdaRole = new iam.Role(this, 'WritlixLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDB Table - WritlixSocialHub
    const writlixSocialHubTable = new dynamodb.Table(this, 'WritlixSocialHubTable', {
      tableName: 'WritlixSocialHub',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN or SNAPSHOT for production
      // pointInTimeRecovery: true, // Recommended for production
    });

    writlixSocialHubTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Grant Lambda role read/write permissions to the DynamoDB table
    writlixSocialHubTable.grantReadWriteData(lambdaRole);

    // Lambda Function: process-scheduled-posts
    const processScheduledPostsFunction = new lambda.Function(this, 'ProcessScheduledPostsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Or your preferred Node.js version
      code: lambda.Code.fromAsset('../backend/writlix-social-hub/process-scheduled-posts/'),
      handler: 'app.handler', // Assuming app.js and exports.handler
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: writlixSocialHubTable.tableName,
        CLERK_SECRET_KEY: 'TODO_FETCH_FROM_SECRETS_MANAGER', // Placeholder -  IMPORTANT: Replace with Secrets Manager integration
        // AWS_REGION is automatically provided by the Lambda runtime
      },
      timeout: cdk.Duration.minutes(1),
    });

    // Lambda Function: api-handler
    const apiHandlerFunction = new lambda.Function(this, 'ApiHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Or your preferred Node.js version
      code: lambda.Code.fromAsset('../backend/writlix-social-hub/api-handler/'),
      handler: 'app.handler', // Assuming app.js and exports.handler
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: writlixSocialHubTable.tableName,
        // AWS_REGION is automatically provided by the Lambda runtime
      },
      timeout: cdk.Duration.seconds(30),
    });

    // HTTP API Gateway for api-handler Lambda
    const httpApi = new apigwv2.HttpApi(this, 'WritlixHttpApi', {
      apiName: 'WritlixSocialHubApi',
      description: 'API for Writlix Social Spark Hub frontend',
      corsPreflight: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
          'Clerk-User-Id', // Custom header for Clerk User ID
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.OPTIONS,
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE, // Include if you plan to add DELETE methods
        ],
        allowOrigins: ['*'], // For development. Restrict in production (e.g., your CloudFront URL).
        // allowCredentials: true, // If you need to pass cookies or auth headers from frontend
      },
    });

    const apiHandlerIntegration = new HttpLambdaIntegration('ApiHandlerIntegration', apiHandlerFunction);

    httpApi.addRoutes({
      path: '/api/schedule-settings',
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST, apigwv2.HttpMethod.PUT],
      integration: apiHandlerIntegration,
    });

    httpApi.addRoutes({
      path: '/api/scheduled-posts',
      methods: [apigwv2.HttpMethod.POST],
      integration: apiHandlerIntegration,
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url!,
      description: 'The URL of the HTTP API Gateway',
    });

    // Create a new VPC for Writlix Social Spark Hub
    const vpc = new ec2.Vpc(this, 'WritlixVpc', {
      maxAzs: 2, 
      natGateways: 0, // No NAT Gateways to save costs
      subnetConfiguration: [
        {
          cidrMask: 24, 
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'ApplicationSubnet', // For Lambdas that need RDS access
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 28, 
          name: 'DatabaseSubnet',    // Dedicated for RDS
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });

    // S3 Bucket for hosting the static frontend
    const frontendBucket = new s3.Bucket(this, 'WritlixFrontendBucket', {
      bucketName: `writlix-social-spark-hub-frontend-${this.account}-${this.region}`,
      publicReadAccess: false, // Keep it private, CloudFront will access it via OAI
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production, but okay for dev to avoid orphaned buckets
      autoDeleteObjects: true, // NOT recommended for production
      websiteIndexDocument: 'index.html', // Though CloudFront will handle this primarily
    });

    // Origin Access Identity to allow CloudFront to access the S3 bucket
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WritlixOAI');
    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'WritlixDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
      },
      defaultRootObject: 'index.html',
      // Handle SPA routing by redirecting errors to index.html
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
      ],
      // Consider adding a price class for cost optimization if needed, e.g., PriceClass.PRICE_CLASS_100
      // priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL, // Default
    });

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
      description: 'The domain name of the CloudFront distribution',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'The name of the S3 bucket for the frontend app',
    });

  }
}
