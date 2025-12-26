// Google Cloud Gemini Configuration
export const GEMINI_CONFIG = {
    // API endpoint for Gemini 1.5 Flash
    API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    
    // Model configuration
    MODEL_NAME: 'gemini-1.5-flash',
    
    // Generation parameters
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

// Get API key from environment variables only
export function getApiKey() {
    // Check for Vite environment variable first (for development)
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    
    // Fallback for legacy Node.js environment variable
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }
    
    // No browser localStorage fallback - require environment variable
    return null;
}

// Check if API key is configured
export function isApiKeyConfigured() {
    const apiKey = getApiKey();
    return apiKey !== null && apiKey !== undefined && apiKey !== '';
}

// Note: API key must be set via environment variable VITE_GEMINI_API_KEY
// This ensures security for production deployments and non-technical users
