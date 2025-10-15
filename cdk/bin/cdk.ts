#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

new FrontendStack(app, 'OpenMicFrontendStack', {
  domainName: 'openmic.site',
  buildPath: '../dist',

  // IMPORTANT: ACM certificates for CloudFront must be in us-east-1
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },

  description: 'Open Mic Vue.js Frontend - S3 + CloudFront + Route53 + ACM',

  tags: {
    Project: 'OpenMic',
    Environment: 'Production',
    ManagedBy: 'CDK',
  },
});

app.synth();
