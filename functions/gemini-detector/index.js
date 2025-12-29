const functions = require('@google-cloud/functions-framework');
const fetch = require('node-fetch');

// Configuration
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Blue Bin Recyclable items for Singapore context
const RECYCLABLE_CATEGORIES = [
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
];

// Detection prompt template
const DETECTION_PROMPT = `Analyze this image and identify ONLY objects that are Blue Bin Recyclable items. 

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

The bounding box coordinates should be relative to image dimensions (0.0 to 1.0).`;

/**
 * Separate main analysis logic for clarity
 */
async function analyzeImage(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // Only accept POST requests for analysis
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    try {
        // Validate request body
        if (!req.body || !req.body.image) {
            res.status(400).json({ error: 'Missing image data in request body' });
            return;
        }

        // Validate API key
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY environment variable not set');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const imageBase64 = req.body.image;

        // Validate base64 data
        if (!isValidBase64(imageBase64)) {
            res.status(400).json({ error: 'Invalid image data format' });
            return;
        }

        console.log('Processing image analysis request...');

        // Call Gemini API
        const detections = await callGeminiAPI(imageBase64);

        console.log(`Detected ${detections.length} recyclable items`);

        // Return successful response
        res.status(200).json({
            success: true,
            detections: detections,
            count: detections.length
        });

    } catch (error) {
        console.error('Error processing image analysis:', error);
        
        // Return appropriate error response
        if (error.message.includes('API request failed')) {
            res.status(502).json({ 
                error: 'External service error',
                details: error.message 
            });
        } else if (error.message.includes('Invalid')) {
            res.status(400).json({ 
                error: 'Invalid request',
                details: error.message 
            });
        } else {
            res.status(500).json({ 
                error: 'Internal server error',
                details: 'An unexpected error occurred while processing the image'
            });
        }
    }
}

/**
 * Call Gemini API with the provided image
 */
async function callGeminiAPI(imageBase64) {
    const requestBody = {
        contents: [{
            parts: [
                {
                    text: DETECTION_PROMPT
                },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: imageBase64
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
        }
    };

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    return parseGeminiResponse(data);
}

/**
 * Parse and validate Gemini API response
 */
function parseGeminiResponse(data) {
    try {
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            console.warn('No content found in Gemini response');
            return [];
        }

        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('No JSON array found in Gemini response:', content);
            return [];
        }

        const detections = JSON.parse(jsonMatch[0]);
        
        // Validate and format the response
        return detections.map(detection => ({
            label: detection.label || 'Unknown',
            box_2d: detection.box_2d || [0, 0, 0, 0],
            recyclable: detection.recyclable === true
        })).filter(detection => {
            // Filter out invalid detections
            return detection.label !== 'Unknown' && 
                   Array.isArray(detection.box_2d) && 
                   detection.box_2d.length === 4 &&
                   validateBoundingBox(detection.box_2d);
        });
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        return [];
    }
}

/**
 * Validate bounding box format
 */
function validateBoundingBox(box2d) {
    if (!Array.isArray(box2d) || box2d.length !== 4) {
        return false;
    }
    
    const [xMin, yMin, width, height] = box2d;
    
    // Check if values are between 0 and 1
    return xMin >= 0 && xMin <= 1 && 
           yMin >= 0 && yMin <= 1 && 
           width > 0 && width <= 1 && 
           height > 0 && height <= 1;
}

/**
 * Validate base64 string format
 */
function isValidBase64(str) {
    if (typeof str !== 'string' || str.trim() === '') {
        return false;
    }
    
    try {
        // Basic format check - should be a valid base64 string
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        return base64Pattern.test(str);
    } catch (error) {
        return false;
    }
}

/**
 * Health check endpoint - handled in main function
 */
function handleHealthCheck(req, res) {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'gemini-detector'
    });
}

/**
 * Main function handler that routes to appropriate endpoint
 */
functions.http('analyzeImage', (req, res) => {
    // Route to health check if /health path
    if (req.path === '/health' || (req.url && req.url.includes('/health'))) {
        handleHealthCheck(req, res);
        return;
    }
    
    // Route to main image analysis
    analyzeImage(req, res);
});
