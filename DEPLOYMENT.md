# Smirkle Deployment Guide

A comprehensive guide for deploying Smirkle to production environments.

## 🚀 Quick Deploy (5 minutes)

### Deploy to Vercel (HTTPS Enabled)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
npx vercel --prod
```

**Result:** Your app is live with HTTPS automatically! Camera will work on mobile.

### Environment Variables (Required)

After deployment, go to Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |

---

## Table of Contents

- [Quick Deploy](#-quick-deploy-5-minutes)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security Checklist](#security-checklist)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/smirkle.git
cd smirkle

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API keys to .env.local
# Edit .env.local and add:
# VITE_YOUTUBE_API_KEY=your_actual_key
# VITE_FIREBASE_API_KEY=your_firebase_key
# VITE_FIREBASE_PROJECT_ID=your_project_id

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Docker Deployment

### Build Docker Image

```bash
# Build the image
docker build -t smirkle:latest .

# Tag for registry
docker tag smirkle:latest your-registry/smirkle:latest

# Push to registry (Docker Hub, ECR, GCR, etc.)
docker push your-registry/smirkle:latest
```

### Run with Docker Compose

```bash
# Create .env file with your secrets
cp .env.example .env.local

# Start services
docker-compose up -d

# View logs
docker-compose logs -f smirkle

# Stop services
docker-compose down
```

### Docker Run (Single Container)

```bash
docker run -d \
  -p 3000:3000 \
  -e VITE_YOUTUBE_API_KEY=your_key \
  -e VITE_FIREBASE_API_KEY=your_key \
  --name smirkle \
  smirkle:latest
```

---

## Cloud Deployment

### Vercel (Recommended for React Apps)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - VITE_YOUTUBE_API_KEY
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_PROJECT_ID

# Deploy to production
vercel --prod
```

### Railway

```bash
# Connect your GitHub repo to Railway
# Add environment variables in Railway dashboard:
# - VITE_YOUTUBE_API_KEY
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_PROJECT_ID

# Railway auto-deploys on push to main branch
```

### AWS (ECS + ECR)

```bash
# Create ECR repository
aws ecr create-repository --repository-name smirkle

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t smirkle:latest .
docker tag smirkle:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/smirkle:latest
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/smirkle:latest

# Deploy to ECS (via AWS Console or CLI)
```

### Google Cloud Run

```bash
# Authenticate with GCP
gcloud auth login

# Build image
gcloud builds submit --tag gcr.io/your-project/smirkle

# Deploy to Cloud Run
gcloud run deploy smirkle \
  --image gcr.io/your-project/smirkle \
  --platform managed \
  --region us-central1 \
  --set-env-vars VITE_YOUTUBE_API_KEY=your_key
```

---

## Environment Variables

### Required Variables

```bash
# YouTube Data API Key
# Get from: https://console.cloud.google.com/apis/
VITE_YOUTUBE_API_KEY=your_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Optional Variables

```bash
# Environment mode
NODE_ENV=production

# Analytics
VITE_GA_TRACKING_ID=your_ga_id

# Error tracking
VITE_SENTRY_DSN=your_sentry_dsn
```

### GitHub Secrets Setup

1. Go to Settings → Secrets and variables → Actions
2. Create the following secrets:
   - `VITE_YOUTUBE_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VERCEL_TOKEN` (for Vercel deployment)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

---

## CI/CD Pipeline

### GitHub Actions

Workflows are defined in `.github/workflows/`:

#### Build & Test (`ci.yml`)
- Runs on every push to main/develop and pull requests
- Lints code
- Builds application
- Scans for exposed secrets
- **Runs on Node 18.x and 20.x**

Trigger manually:
```bash
git push # Automatically triggers CI workflow
```

#### Deploy (`deploy.yml`)
- Runs only on main branch pushes
- Builds application
- Deploys to Vercel (requires secrets)
- Can be triggered manually via GitHub Actions tab

### View Pipeline Status

```bash
# View workflow runs
gh run list

# View specific workflow run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

---

## Security Checklist

- ✅ API keys removed from repository (use GitHub Secrets)
- ✅ Environment variables not logged
- ✅ HTTPS enabled on all endpoints
- ✅ CORS properly configured
- ✅ CSP headers configured
- ✅ Dependency vulnerabilities scanned (`npm audit`)
- ✅ Non-root user in Docker image
- ✅ .env files in .gitignore
- ✅ Secret scanning enabled in GitHub
- ✅ Input validation on all user inputs

### Run Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check dependencies
npm outdated
```

---

## Performance Optimization

### Build Optimization

```bash
# Check bundle size
npm run build -- --stats

# Analyze bundle
# Install: npm install -D webpack-bundle-analyzer
```

### Image Optimization

- Images stored in `/public` are cached by CDN
- Use next-gen formats (WebP, AVIF)
- Implement lazy loading for images
- Use responsive images

### Database Optimization

- Firestore indexes configured
- Query optimization
- Avoid N+1 queries
- Implement caching layer (Redis)

---

## Monitoring & Logging

### Sentry (Error Tracking)

```bash
pip install sentry-sdk

# Configure in initialization
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

### Google Analytics

```javascript
// Initialize in main.jsx
import ReactGA from 'react-ga';
ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);
```

### Vercel Analytics

Automatically included with Vercel deployment. View at:
https://vercel.com/dashboard/projects/smirkle/analytics

### Health Checks

Docker image includes healthcheck:
```bash
docker ps  # See health status
```

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check Node version
node --version  # Should be 18.x or higher

# Verbose output
npm run build -- --verbose
```

### Docker Issues

```bash
# Check image size
docker images smirkle

# Inspect running container
docker inspect smirkle

# View container logs
docker logs smirkle

# Execute command in container
docker exec -it smirkle sh
```

### Deployment Fails

```bash
# Check GitHub Actions logs
# Visit: https://github.com/your-org/smirkle/actions

# Check Vercel deployment
# Visit: https://vercel.com/dashboard

# Check environment variables
env | grep VITE_  # Local
# GitHub: Settings → Secrets
# Vercel: Project Settings → Environment
```

### Performance Issues

```bash
# Profile bundle
npm run build -- --analyze

# Check Lighthouse score
# Install: npm install -D lighthouse
# Run: lighthouse http://localhost:3000

# Monitor API calls
# Check Network tab in DevTools
# Use: https://pageinsights.web.dev/
```

---

## Rollback Procedure

### Vercel

```bash
# View deployment history
vercel ls

# Rollback to previous deployment
vercel rollback
```

### GitHub

```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# This will trigger CI/CD pipeline automatically
```

### Docker

```bash
# Revert to previous image
docker pull your-registry/smirkle:previous-tag
docker-compose down
docker-compose up -d  # Update docker-compose.yml image tag first
```
