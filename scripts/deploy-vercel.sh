#!/bin/bash

# Smirkle Quick Deploy to Vercel (HTTPS Enabled)
# This script deploys Smirkle with automatic HTTPS

set -e

echo "🚀 Smirkle Vercel Deploy Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check if environment variables are set
echo ""
echo "🔐 Checking environment variables..."

if [ -z "$VITE_YOUTUBE_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  VITE_YOUTUBE_API_KEY not set${NC}"
    echo "   Set it in Vercel dashboard after deployment or in .env.local"
fi

if [ -z "$VITE_FIREBASE_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  VITE_FIREBASE_API_KEY not set${NC}"
    echo "   Set it in Vercel dashboard after deployment or in .env.local"
fi

# Deploy to Vercel
echo ""
echo -e "${GREEN}🚀 Deploying to Vercel (HTTPS will be auto-enabled)...${NC}"
echo ""

# Run vercel in production mode
vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Go to https://vercel.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to Settings → Environment Variables"
echo "   4. Add the required API keys:"
echo "      - VITE_YOUTUBE_API_KEY"
echo "      - VITE_FIREBASE_API_KEY"
echo "      - VITE_FIREBASE_PROJECT_ID"
echo "   5. Redeploy to apply environment variables"
echo ""
echo -e "${GREEN}🌐 Your app is now available at HTTPS URL with camera support!${NC}"
