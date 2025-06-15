#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SimpleApiStack } from '../lib/simple-api-stack';

const app = new cdk.App();
new SimpleApiStack(app, 'SimpleApiStack', {
  env: { account: '000000000000', region: 'us-east-1' },
});