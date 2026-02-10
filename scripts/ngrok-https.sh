#!/bin/bash

# Smirkle Local HTTPS with ngrok
# This script creates an HTTPS tunnel to your local development server
# Required for camera testing on mobile devices

set -e

echo "🚀 Smirkle ngrok HTTPS Tunnel"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}📦 Installing ngrok...${NC}"
    npm install -g ngrok
fi

# Check if dev server is running
echo ""
echo "🔍 Checking if dev server is running on port 5173..."
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Dev server not detected on port 5173${NC}"
    echo "   Starting dev server in background..."
    npm run dev &
    DEV_PID=$!
    echo "   Dev server started (PID: $DEV_PID)"
    echo "   Waiting for server to start..."
    sleep 5
fi

# Start ngrok tunnel
echo ""
echo -e "${GREEN}🔗 Creating HTTPS tunnel to localhost:5173...${NC}"
echo ""
echo "=========================================="
echo -e "${GREEN}🌐 Your HTTPS URL for mobile testing:${NC}"
echo ""
ngrok http 5173 --log=stdout | grep -o 'https://[^[:space:]]*\.ngrok-free\.app' | head -1
echo ""
echo "=========================================="
echo ""
echo "📱 Use this HTTPS URL on your Android/iOS device"
echo "   Camera permission will work because of HTTPS!"
echo ""
echo "⏹️  Press Ctrl+C to stop the tunnel"
echo ""

# Keep running and show ngrok output
ngrok http 5173
