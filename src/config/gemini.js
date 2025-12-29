// Google Cloud Gemini Configuration
export const GEMINI_CONFIG = {
    // Cloud Function endpoint for secure Gemini API access
    CLOUD_FUNCTION_URL: process.env.GEMINI_CLOUD_FUNCTION_URL || 'https://us-central1-your-project.cloudfunctions.net/analyzeImage',
    
    // Local development endpoint
    LOCAL_FUNCTION_URL: 'http://localhost:8080/analyzeImage',
    
    // Health check endpoint
    HEALTH_CHECK_URL: process.env.GEMINI_CLOUD_FUNCTION_URL ? 
        process.env.GEMINI_CLOUD_FUNCTION_URL.replace('/analyzeImage', '/health') : 
        'https://us-central1-your-project.cloudfunctions.net/health',
    
    // Model configuration (for reference only - now handled by cloud function)
    MODEL_NAME: 'gemini-1.5-flash',
    
    // Generation parameters (for reference only - now handled by cloud function)
    GENERATION_CONFIG: {
        temperature: 0.1,        // Low temperature for consistent results
        topK: 32,              // Top-k sampling
        topP: 1,               // Nucleus sampling
        maxOutputTokens: 4096,  // Maximum tokens in response
    },
    
    // Blue Bin Recyclable items for Singapore context
    RECYCLABLE_CATEGORIES: [
        'Aluminium Cans',
        'ring pulls',
        'Toilet Rolls',
        'Paper towel rolls',
        'Glass Bottles',
        'Jars',
        'Aerosol Cans',
        'Empty Food Cans',
        'Newspaper',
        'Plastic Egg Trays',
        'Paper Egg Trays',
        'Paper bags without handles',
        'Metal caps',
        'lids',
        'Magazines & Glossy paper',
        'Other paper',
        'Black & white paper',
        'Food tins',
        'Gift wrapping paper',
        'can',
        'paper',
        'cardboard',
        'plastic container'
    ],
    
    // Prompt template for object detection
    DETECTION_PROMPT: `Analyze this image and identify ONLY objects that are Blue Bin Recyclable items. 

Blue Bin Recyclable items include:
- Aluminium Cans and ring pulls
- Glass Bottles and Jars
- Aerosol Cans
- Empty Food Cans
- Plastic containers (bottles, containers, trays)
- Paper items (newspapers, magazines, cardboard, paper bags without handles)
- Metal caps and lids
- Toilet rolls and paper towel rolls

IMPORTANT:
1. Return ONLY items that are definitely recyclable in Blue Bins
2. For each recyclable item detected, provide a 2D bounding box in format [x_min, y_min, width, height]
3. Return response as a valid JSON array
4. If no recyclable items are found, return an empty array []

Response format:
[
  {
    "label": "Plastic Bottle",
    "box_2d": [x_min, y_min, width, height],
    "recyclable": true
  }
]

The bounding box coordinates should be relative to image dimensions (0.0 to 1.0).`
};

// Get the appropriate cloud function URL based on environment
export function getCloudFunctionUrl() {
    // Check for Vite environment variable first (for development)
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_CLOUD_FUNCTION_URL) {
        return import.meta.env.VITE_GEMINI_CLOUD_FUNCTION_URL;
    }
    
    // Fallback for legacy Node.js environment variable
    if (typeof process !== 'undefined' && process.env?.GEMINI_CLOUD_FUNCTION_URL) {
        return process.env.GEMINI_CLOUD_FUNCTION_URL;
    }
    
    // Check if we're in development mode and use local function
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        return GEMINI_CONFIG.LOCAL_FUNCTION_URL;
    }
    
    // Default to production URL (will need to be updated with actual deployed URL)
    return GEMINI_CONFIG.CLOUD_FUNCTION_URL;
}

// Get health check URL
export function getHealthCheckUrl() {
    const functionUrl = getCloudFunctionUrl();
    return functionUrl.replace('/analyzeImage', '/health');
}

// Check if cloud function is configured
export function isCloudFunctionConfigured() {
    const url = getCloudFunctionUrl();
    return url && url !== '' && url !== 'https://us-central1-your-project.cloudfunctions.net/analyzeImage';
}

// Determine if we should use local development endpoint
export function useLocalFunction() {
    return typeof import.meta !== 'undefined' && import.meta.env?.DEV;
}

// Note: Cloud Function URL must be set via environment variable VITE_GEMINI_CLOUD_FUNCTION_URL
// This ensures security for production deployments and non-technical users
