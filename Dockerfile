# Build stage: compile TypeScript and build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY . .

# Build the static site with Vite
RUN npm run build

# Compile Lambda handler
RUN npx tsc lambda/handler.ts --outDir lambda-dist --esModuleInterop --module commonjs --target ES2020 --declaration --skipLibCheck

# Production stage: AWS Lambda container
FROM public.ecr.aws/lambda/nodejs:20

# Copy built static assets
COPY --from=builder /app/dist ${LAMBDA_TASK_ROOT}/dist

# Copy compiled Lambda handler
COPY --from=builder /app/lambda-dist/handler.js ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD ["handler.handler"]
