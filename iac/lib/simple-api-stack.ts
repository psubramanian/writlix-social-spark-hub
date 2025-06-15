import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SimpleApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // IAM Role for Lambda Functions
    const lambdaRole = new iam.Role(this, 'WritlixLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Reference existing DynamoDB Table - WritlixSocialHub (already exists in LocalStack)
    const writlixSocialHubTable = dynamodb.Table.fromTableName(this, 'WritlixSocialHubTable', 'WritlixSocialHub');

    // Grant Lambda role read/write permissions to the existing DynamoDB table
    writlixSocialHubTable.grantReadWriteData(lambdaRole);

    // Lambda Function: process-scheduled-posts
    const processScheduledPostsFunction = new lambda.Function(this, 'ProcessScheduledPostsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('../backend/writlix-social-hub/process-scheduled-posts/'),
      handler: 'app.handler',
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: writlixSocialHubTable.tableName,
        CLERK_SECRET_KEY: 'sk_test_zvHcHODs87jNs66ZySJrRJnkyWb3VQI329DuKK7ynt', // Using test key for LocalStack
        LOCALSTACK_HOSTNAME: '172.17.0.2', // LocalStack container IP for Lambda containers
        DYNAMODB_ENDPOINT: 'http://172.17.0.2:4566', // LocalStack DynamoDB endpoint using container IP
      },
      timeout: cdk.Duration.minutes(1),
    });

    // Lambda Function: api-handler
    const apiHandlerFunction = new lambda.Function(this, 'ApiHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('../backend/writlix-social-hub/api-handler/'),
      handler: 'app.handler',
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: writlixSocialHubTable.tableName,
        LOCALSTACK_HOSTNAME: '172.17.0.2', // LocalStack container IP for Lambda containers
        DYNAMODB_ENDPOINT: 'http://172.17.0.2:4566', // LocalStack DynamoDB endpoint using container IP
      },
      timeout: cdk.Duration.minutes(5),
    });

    // REST API Gateway for api-handler Lambda (compatible with LocalStack Community)
    const api = new apigateway.RestApi(this, 'WritlixRestApi', {
      restApiName: 'WritlixSocialHubApi',
      description: 'API for Writlix Social Spark Hub frontend',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiHandlerFunction);

    // Create /api resource
    const apiResource = api.root.addResource('api');
    
    // Create /api/schedule-settings resource
    const scheduleSettingsResource = apiResource.addResource('schedule-settings');
    scheduleSettingsResource.addMethod('GET', apiIntegration);
    scheduleSettingsResource.addMethod('POST', apiIntegration);
    scheduleSettingsResource.addMethod('PUT', apiIntegration);

    // Create /api/scheduled-posts resource
    const scheduledPostsResource = apiResource.addResource('scheduled-posts');
    scheduledPostsResource.addMethod('GET', apiIntegration);
    scheduledPostsResource.addMethod('POST', apiIntegration);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: api.url,
      description: 'The URL of the REST API Gateway',
    });
  }
}