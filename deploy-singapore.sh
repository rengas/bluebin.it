#!/bin/bash

# Deployment script for BlueBin.it Gemini Cloud Function to Singapore region
# This script deploys the cloud function to asia-southeast1 (Singapore)

echo "🚀 Deploying BlueBin.it Gemini Cloud Function to Singapore region..."
echo "Region: asia-southeast1"

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    echo "Please install it first: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "❌ Error: Not logged into Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Navigate to function directory
cd functions/gemini-detector

# Check if .env file exists with API key
if [ ! -f ".env" ] || ! grep -q "GEMINI_API_KEY=" .env || grep -q "your_gemini_api_key_here" .env; then
    echo "❌ Error: Gemini API key not configured."
    echo "Please edit functions/gemini-detector/.env and add your API key:"
    echo "GEMINI_API_KEY=your_actual_api_key_here"
    exit 1
fi

# Extract API key from .env
API_KEY=$(grep "GEMINI_API_KEY=" .env | cut -d'=' -f2)

echo "📋 Configuration:"
echo "  Function Name: analyzeImage"
echo "  Region: asia-southeast1 (Singapore)"
echo "  Runtime: nodejs20"
echo "  Authentication: Allow unauthenticated"
echo "  API Key: ${API_KEY:0:10}..."

# Deploy the function
echo ""
echo "🌍 Deploying to Google Cloud Functions..."
gcloud functions deploy analyzeImage \
    --runtime=nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point=analyzeImage \
    --region=asia-southeast1 \
    --set-env-vars=GEMINI_API_KEY=${API_KEY} \
    --memory=512MiB \
    --timeout=60s

# Check deployment result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your production environment variable:"
    echo "   VITE_GEMINI_CLOUD_FUNCTION_URL=https://asia-southeast1-\$(gcloud config get-value project).cloudfunctions.net/analyzeImage"
    echo ""
    echo "2. Test the deployed function:"
    echo "   curl https://asia-southeast1-\$(gcloud config get-value project).cloudfunctions.net/health"
    echo ""
    echo "3. Monitor the function:"
    echo "   https://console.cloud.google.com/functions/list?project=\$(gcloud config get-value project)"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error message above and try again."
    exit 1
fi
