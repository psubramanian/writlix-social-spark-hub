#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleApiStack } from '../lib/simple-api-stack';

const app = new cdk.App();
new SimpleApiStack(app, 'SimpleApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});