# 🚀 Deployment Guide - Squarespace DNS

This guide covers deploying the Open Mic Vue app to AWS with Squarespace DNS management.

## 📋 Overview

**Infrastructure:**
- ☁️ **S3** - Static file hosting
- 🌍 **CloudFront** - Global CDN with HTTPS
- 🔒 **ACM** - Free SSL certificate
- 🌐 **Squarespace DNS** - Your existing domain DNS

**No Route53** - DNS stays with Squarespace, email forwarding keeps working!

---

## ✅ Prerequisites

1. **AWS Account** with CLI configured
2. **AWS CDK** installed: `npm install -g aws-cdk`
3. **Domain**: `openmic.site` registered with Squarespace
4. **Node.js** v18+ installed

---

## 🛠️ First-Time Setup

### 1. Bootstrap CDK (One-time)

```bash
# From the cdk/ directory
cd cdk
npx cdk bootstrap aws://YOUR-ACCOUNT-ID/us-east-1
```

### 2. Install Dependencies

```bash
# From root directory
npm install
npm run cdk:install
```

---

## 🚢 Deploy to AWS

### Step 1: Build and Deploy

```bash
# From root directory
npm run deploy:full
```

This will:
1. Build Vue app → `dist/`
2. Create S3 bucket
3. Create CloudFront distribution
4. Request SSL certificate
5. Upload files to S3

**Deployment takes ~10-15 minutes** (CloudFront is slow to create)

### Step 2: Note the Outputs

After deployment, you'll see:

```
Outputs:
OpenMicFrontendStack.CloudFrontDomainName = d1234567890abc.cloudfront.net
OpenMicFrontendStack.CertificateArn = arn:aws:acm:us-east-1:...
OpenMicFrontendStack.SquarespaceCNAME1 = CNAME | @ | d1234567890abc.cloudfront.net
OpenMicFrontendStack.SquarespaceCNAME2 = CNAME | www | d1234567890abc.cloudfront.net
```

**Copy the CloudFront domain name** (e.g., `d1234567890abc.cloudfront.net`)

---

## 🌐 Configure Squarespace DNS

### Step 3: Add SSL Certificate Validation Records

1. Go to AWS Console → **Certificate Manager** (us-east-1 region)
2. Find your certificate for `openmic.site`
3. It will show DNS validation records like:

   ```
   Name: _abc123def456.openmic.site
   Type: CNAME
   Value: _xyz789abc456.acm-validations.aws.
   ```

4. Go to **Squarespace** → Settings → Domains → `openmic.site` → DNS Settings
5. Click **Add Record**
6. Add each validation CNAME record:
   - **Host**: `_abc123def456` (without .openmic.site)
   - **Type**: CNAME
   - **Data**: `_xyz789abc456.acm-validations.aws.`
   - **Priority**: (leave empty)

7. Repeat for www subdomain validation record if shown

**Wait 5-10 minutes** for AWS to validate the certificate

### Step 4: Add CloudFront CNAME Records

Once certificate shows "Issued" in AWS Console:

1. In **Squarespace DNS Settings**, add:

   **Record 1 (Root domain):**
   - **Host**: `@`
   - **Type**: CNAME
   - **Data**: `d1234567890abc.cloudfront.net` (your CloudFront domain)

   **Record 2 (WWW subdomain):**
   - **Host**: `www`
   - **Type**: CNAME
   - **Data**: `d1234567890abc.cloudfront.net` (same CloudFront domain)

2. **Save** DNS settings

**Wait 10-30 minutes** for DNS propagation

---

## ✅ Verification

### Test CloudFront Directly

```bash
# This should work immediately after deployment
curl https://d1234567890abc.cloudfront.net
```

### Test Custom Domain

```bash
# This works after DNS propagation (~10-30 min)
curl https://openmic.site
curl https://www.openmic.site
```

Both should return your Vue app's HTML.

---

## 🔄 Updating the Site

After making changes to your Vue app:

```bash
npm run deploy
```

This will:
1. Build the latest Vue code
2. Upload to S3
3. Invalidate CloudFront cache
4. Your site updates in ~1-2 minutes

**No DNS changes needed on updates!**

---

## 📧 Email Forwarding

Your Squarespace email forwarding continues to work because:
- DNS stays with Squarespace
- Only CNAME records added
- MX records untouched

Example:
- `hello@openmic.site` → `your@gmail.com` ✅ Still works!

---

## 🐛 Troubleshooting

### Certificate Stuck in "Pending Validation"

**Problem:** ACM certificate not validating

**Solution:**
1. Check DNS records in Squarespace match AWS Console exactly
2. Wait 10 minutes (DNS propagation)
3. Verify with: `dig _abc123def456.openmic.site CNAME`

### "CloudFront distribution not found" error

**Problem:** Domain not working yet

**Solution:**
1. Verify certificate shows "Issued" in AWS Console
2. Check CNAME records in Squarespace
3. Wait for DNS propagation: `dig openmic.site`
4. Should show CloudFront domain in response

### Email forwarding stopped working

**Problem:** Accidentally deleted MX records

**Solution:**
1. Check Squarespace DNS settings
2. Ensure MX records still exist
3. Re-add if missing (Squarespace support can help)

### Site not updating after deploy

**Problem:** CloudFront cache

**Solution:**
```bash
# Manual cache invalidation
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## 💰 Monthly Costs

For 150 users, 4 hours, 1-2 events/month:

| Service | Cost |
|---------|------|
| S3 | $0.01 |
| CloudFront | $0.05 (after free tier) |
| API Gateway WebSocket | $0.16 |
| Lambda | $0.09 (after free tier) |
| DynamoDB | $0.25 |
| **Total** | **~$0.56/month** |

**With free tier (first 12 months): ~$0.42/month**

**No Route53 fee!** 🎉

---

## 🔒 Security Notes

- S3 bucket is **private** (not publicly accessible)
- CloudFront is the only way to access files
- HTTPS enforced (HTTP redirects to HTTPS)
- SSL certificate auto-renews every 13 months

---

## 🆘 Need Help?

- **AWS Certificate Manager:** https://console.aws.amazon.com/acm
- **CloudFront Console:** https://console.aws.amazon.com/cloudfront
- **Squarespace DNS Help:** https://support.squarespace.com/hc/en-us/articles/205812378

---

## 📝 Summary Checklist

- [ ] Run `npm run deploy:full`
- [ ] Copy CloudFront domain name from outputs
- [ ] Add ACM validation CNAME records in Squarespace
- [ ] Wait for certificate to show "Issued" (~5-10 min)
- [ ] Add CloudFront CNAME records in Squarespace (@ and www)
- [ ] Wait for DNS propagation (~10-30 min)
- [ ] Test `https://openmic.site` ✅
- [ ] Email forwarding still works ✅

Done! 🎉
