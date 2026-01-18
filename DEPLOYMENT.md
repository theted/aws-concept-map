# Deployment Guide

This document describes how to deploy the AWS Services Concept Map to AWS Lambda using container images.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Actions │────▶│   Amazon ECR    │────▶│  AWS Lambda     │
│    (CI/CD)      │     │ (Container Reg) │     │ (Function URL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

The application is packaged as a Docker container that runs on AWS Lambda. Lambda Function URLs provide a public HTTPS endpoint without requiring API Gateway.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed (for local testing)
- Node.js 20.x (for local development)
- GitHub repository with Actions enabled

### Required AWS Permissions

The IAM user/role used for deployment needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:*:*:function:aws-services-concept-map"
    }
  ]
}
```

## AWS Infrastructure Setup

### 1. Create ECR Repository

```bash
# Set your AWS region
export AWS_REGION=eu-north-1

# Create the ECR repository
aws ecr create-repository \
  --repository-name aws-services-concept-map \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true
```

Save the repository URI from the output (format: `<account-id>.dkr.ecr.<region>.amazonaws.com/aws-services-concept-map`).

### 2. Create Lambda Function

First, push an initial image to ECR (see Manual Deployment below), then create the Lambda function:

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create the Lambda execution role
aws iam create-role \
  --role-name aws-services-concept-map-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name aws-services-concept-map-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Wait for role to propagate
sleep 10

# Create the Lambda function
aws lambda create-function \
  --function-name aws-services-concept-map \
  --package-type Image \
  --code ImageUri=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-services-concept-map:latest \
  --role arn:aws:iam::$AWS_ACCOUNT_ID:role/aws-services-concept-map-role \
  --timeout 30 \
  --memory-size 256 \
  --region $AWS_REGION
```

### 3. Create Function URL

```bash
# Create the function URL
aws lambda create-function-url-config \
  --function-name aws-services-concept-map \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["GET"],
    "AllowHeaders": ["*"]
  }'

# Add permission for public access
aws lambda add-permission \
  --function-name aws-services-concept-map \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE
```

The function URL will be output (format: `https://<id>.lambda-url.<region>.on.aws/`).

## GitHub Actions Configuration

The repository includes two workflows:
- **CI** (`.github/workflows/ci.yml`): Runs on all pushes and PRs - tests, type checking, build verification
- **Deploy** (`.github/workflows/deploy.yml`): Runs on main/master pushes - builds and deploys to Lambda

### Required Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions → Secrets):

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for deployment |

### Optional Variables

Add these variables in your GitHub repository settings (Settings → Secrets and variables → Actions → Variables):

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `eu-north-1` | AWS region for deployment |
| `ECR_REPOSITORY` | `aws-services-concept-map` | ECR repository name |
| `LAMBDA_FUNCTION_NAME` | `aws-services-concept-map` | Lambda function name |

## Local Development

### Running the Development Server

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (for CI)
npm run test:run
```

### Building Locally

```bash
# Build the static site
npm run build

# Build Lambda handler
npm run build:lambda

# Build everything
npm run build:all
```

## Local Docker Testing

Test the Lambda container locally before deploying:

```bash
# Build the Docker image
npm run docker:build

# Run the container locally
npm run docker:run
```

The container runs on port 9000. Test with:

```bash
# Test the root endpoint
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{"rawPath": "/"}'

# Test a specific file
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{"rawPath": "/style.css"}'
```

## Manual Deployment

If you need to deploy without GitHub Actions:

### 1. Configure Environment

```bash
# Copy and edit the environment file
cp .env.example .env
# Edit .env with your values
```

### 2. Build and Push to ECR

```bash
# Load environment variables
source .env

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Authenticate Docker with ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Build the image
docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .

# Push to ECR
docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
```

### 3. Update Lambda Function

```bash
# Update the function code
aws lambda update-function-code \
  --function-name $LAMBDA_FUNCTION_NAME \
  --image-uri $ECR_REGISTRY/$ECR_REPOSITORY:latest \
  --region $AWS_REGION

# Wait for the update to complete
aws lambda wait function-updated \
  --function-name $LAMBDA_FUNCTION_NAME \
  --region $AWS_REGION
```

## Troubleshooting

### Container fails to start

Check Lambda logs in CloudWatch:

```bash
aws logs tail /aws/lambda/aws-services-concept-map --follow
```

Common issues:
- **Handler not found**: Ensure the handler is compiled to `handler.handler`
- **Missing dist directory**: Verify the build stage copies files correctly

### Function URL returns 500

1. Check that static files exist in the container:
   ```bash
   docker run --rm aws-services-concept-map:local ls -la /var/task/dist
   ```

2. Verify the handler compiles correctly:
   ```bash
   npm run build:lambda
   ```

### ECR push fails

- Ensure Docker is authenticated: `aws ecr get-login-password | docker login`
- Check ECR repository exists: `aws ecr describe-repositories`
- Verify IAM permissions include ECR write access

### Deployment workflow fails

1. Check GitHub Actions logs for specific error
2. Verify secrets are set correctly (especially AWS credentials)
3. Ensure the Lambda function exists before first deploy
4. Check that the ECR repository exists

## Estimated Costs

For low-traffic usage (< 1M requests/month):
- **Lambda**: Free tier covers 1M requests and 400,000 GB-seconds
- **ECR**: ~$0.10/GB/month for image storage (image is ~50MB)
- **Data Transfer**: First 100GB/month is free

Total estimated cost for low-traffic: **< $1/month**
