#!/bin/bash

# Deployment script for BlueBin.it Gemini Cloud Function to Singapore region
# Region: asia-southeast1 (Singapore)

# --- Configuration ---
FUNCTION_NAME="analyzeImage"
REGION="asia-southeast1"
ENTRY_POINT="analyzeImage"
RUNTIME="nodejs20"
SOURCE_DIR="functions/gemini-detector"

echo "🚀 Starting deployment for ${FUNCTION_NAME}..."

# 1. Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    exit 1
fi

# 2. Check Login and Project
CURRENT_PROJECT=$(gcloud config get-value project 2> /dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo "❌ Error: No Google Cloud project selected."
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
echo "📍 Target Project: $CURRENT_PROJECT"
echo "📍 Target Region:  $REGION"

# 3. Navigate safely to function directory
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Directory '$SOURCE_DIR' not found."
    echo "Make sure you are running this script from the project root."
    exit 1
fi
cd "$SOURCE_DIR" || exit 1

# 4. API Key Check
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in $SOURCE_DIR"
    exit 1
fi

# Robustly extract API Key (handles quotes and spaces better)
API_KEY=$(grep "^GEMINI_API_KEY=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [[ -z "$API_KEY" ]] || [[ "$API_KEY" == *"your_gemini"* ]]; then
    echo "❌ Error: Invalid or missing GEMINI_API_KEY in .env"
    exit 1
fi

echo "🔐 API Key found (ends in ...${API_KEY: -4})"

# 5. Deploy
echo ""
echo "🌍 Deploying to Google Cloud Functions (Singapore)..."

# Added --gen2 for better performance (Optional: remove --gen2 if you strictly need Gen 1)
# Added --quiet to prevent interactive prompts from blocking the script
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --source=. \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars=GEMINI_API_KEY="${API_KEY}" \
    --memory=512MiB \
    --timeout=60s \
    --quiet

# 6. Result & Dynamic URL Retrieval
if [ $? -eq 0 ]; then
    # Dynamically fetch the actual URL assigned by Google (Works for Gen 1 and Gen 2)
    FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --format='value(serviceConfig.uri)')

    echo ""
    echo "✅ Deployment successful!"
    echo "--------------------------------------------------"
    echo "🔗 Function URL: $FUNCTION_URL"
    echo "--------------------------------------------------"
    echo "📝 Next steps:"
    echo "1. Update your frontend .env:"
    echo "   VITE_GEMINI_CLOUD_FUNCTION_URL=$FUNCTION_URL"
    echo ""
    echo "2. Test with curl:"
    echo "   curl -X POST $FUNCTION_URL -H 'Content-Type: application/json' -d '{}'"
else
    echo ""
    echo "❌ Deployment failed."
    exit 1
fi