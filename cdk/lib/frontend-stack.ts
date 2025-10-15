import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

export interface FrontendStackProps extends cdk.StackProps {
  domainName: string;
  /**
   * Path to the Vue.js build output directory (relative to cdk/)
   * Default: '../dist'
   */
  buildPath?: string;
}

export class FrontendStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { domainName, buildPath = '../dist' } = props;

    // S3 Bucket for hosting (private)
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `open-mic-frontend-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          // Delete old versions after 30 days
          noncurrentVersionExpiration: cdk.Duration.days(30),
          noncurrentVersionsToRetain: 3,
        },
      ],
    });

    // SSL Certificate (must be in us-east-1 for CloudFront)
    // Using external DNS validation (Squarespace)
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      subjectAlternativeNames: [`www.${domainName}`],
      validation: acm.CertificateValidation.fromDns(),
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${domainName}`,
    });

    // Grant CloudFront read access to S3
    this.bucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [domainName, `www.${domainName}`],
      certificate: this.certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          // SPA routing: redirect 403/404 to index.html
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      comment: 'Open Mic Vue.js Frontend Distribution',
    });

    // S3 Deployment - Upload Vue.js build to S3 and invalidate CloudFront cache
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, buildPath))],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'], // Invalidate all paths
      prune: true, // Remove old files
      memoryLimit: 512, // MB
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Domain Name (for Squarespace CNAME)',
      exportName: 'CloudFrontDomainName',
    });

    new cdk.CfnOutput(this, 'SiteURL', {
      value: `https://${domainName}`,
      description: 'Website URL (after DNS setup)',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM Certificate ARN',
    });

    // DNS Records to add in Squarespace
    new cdk.CfnOutput(this, 'SquarespaceDNSInstructions', {
      value: 'Add these records in Squarespace DNS settings',
      description: '=== SQUARESPACE DNS SETUP ==='
    });

    new cdk.CfnOutput(this, 'SquarespaceCNAME1', {
      value: `CNAME | @ | ${this.distribution.distributionDomainName}`,
      description: '1. Root domain CNAME'
    });

    new cdk.CfnOutput(this, 'SquarespaceCNAME2', {
      value: `CNAME | www | ${this.distribution.distributionDomainName}`,
      description: '2. WWW subdomain CNAME'
    });

    new cdk.CfnOutput(this, 'ACMValidationNote', {
      value: 'Check AWS Console → Certificate Manager for DNS validation records',
      description: '3. ACM Certificate Validation'
    });
  }
}
