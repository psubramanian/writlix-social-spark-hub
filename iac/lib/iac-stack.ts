import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

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
