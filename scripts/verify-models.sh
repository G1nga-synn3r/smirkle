#!/usr/bin/env bash

# Script to verify Smirkle AI models are deployed correctly on Vercel or production
# Run this in your browser console after deployment to diagnose model loading failures

echo "⏳ Starting model verification..."
echo ""

# Check local models
echo "📦 Checking local model files..."

models=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1.bin"
  "face_expression_model-weights_manifest.json"
  "face_expression_model-shard1.bin"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1.bin"
)

missing=0
for model in "${models[@]}"; do
  if [ -f "public/models/$model" ]; then
    size=$(du -h "public/models/$model" | cut -f1)
    echo "✓ $model ($size)"
  else
    echo "✗ MISSING: $model"
    ((missing++))
  fi
done

echo ""
if [ $missing -eq 0 ]; then
  echo "✅ All model files present locally!"
  echo ""
  echo "📤 Now deploy to Vercel:"
  echo "   git push"
  echo ""
  echo "🔍 After deployment, check:"
  echo "   https://your-smirkle-app.vercel.app/models/tiny_face_detector_model-weights_manifest.json"
  echo "   (Should return JSON, not 404)"
else
  echo "❌ Missing $missing model files!"
echo "   Download models from: https://github.com/vladmandic/face-api/tree/master/models"
  echo "   Place them in: ./public/models/"
  exit 1
fi
