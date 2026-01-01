const functions = require('@google-cloud/functions-framework');
const fetch = require('node-fetch');

// Configuration
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent';
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

// Detection prompt template optimized for Gemini Robotics-ER 1.5
const DETECTION_PROMPT = `As a robotics vision system, analyze this image and identify ONLY objects that are Blue Bin Recyclable items for automated sorting in Singapore's recycling system.

TARGET RECYCLABLE ITEMS FOR ROBOTIC DETECTION:
- Aluminium Cans and ring pulls (metal containers)
- Glass Bottles and Jars (transparent containers)
- Aerosol Cans (metal containers)
- Empty Food Cans (metal containers)
- Plastic containers (bottles, containers, trays - PET/HDPE)
- Paper items (newspapers, magazines, cardboard, paper bags without handles)
- Metal caps and lids
- Toilet rolls and paper towel rolls (cardboard tubes)

ROBOTIC VISION REQUIREMENTS:
1. HIGH PRECISION: Return ONLY items that are definitely recyclable in Blue Bins
2. SPATIAL MAPPING: For each recyclable item detected, provide precise 2D bounding box coordinates [x_min, y_min, width, height] for robotic manipulation
3. STRUCTURED OUTPUT: Return response as a valid JSON array for robotic system integration
4. FAIL-SAFE: If no recyclable items are found, return an empty array []

STANDARDIZED RESPONSE FORMAT:
[
  {
    "label": "Plastic Bottle",
    "box_2d": [x_min, y_min, width, height],
    "recyclable": true
  }
]

COORDINATE SYSTEM: Bounding box coordinates must be relative to image dimensions (0.0 to 1.0) for robotic arm positioning.

ROBOTIC ACCURACY NOTES: Focus on clear, unobstructed items suitable for robotic grasping. Avoid ambiguous or partially visible objects.`;

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
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.warn('GEMINI_API_KEY environment variable not set - using mock response for testing');
            // Return mock response for testing without API key
            res.status(200).json({
                success: true,
                detections: [
                    {
                        label: "Test Plastic Bottle",
                        box_2d: [0.1, 0.1, 0.3, 0.4],
                        recyclable: true
                    },
                    {
                        label: "Test Aluminum Can",
                        box_2d: [0.5, 0.2, 0.25, 0.3],
                        recyclable: true
                    }
                ],
                count: 2
            });
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
            temperature: 0.1,  // Low temperature for consistent robotic detection
            topK: 20,          // Reduced for more focused predictions
            topP: 0.95,        // Slightly reduced for precision
            maxOutputTokens: 4096,
            candidateCount: 1,  // Single best response for robotics
            stopSequences: []  // Let model determine completion
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
 * Parse and validate Gemini Robotics API response
 */
function parseGeminiResponse(data) {
    try {
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            console.warn('No content found in Gemini Robotics response');
            return [];
        }

        console.log('Raw Robotics response:', content);

        // Enhanced JSON extraction for Robotics model responses
        let jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            // Try alternative JSON extraction patterns
            jsonMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/) || 
                        content.match(/(\[[\s\S]*?\])/);
        }

        if (!jsonMatch) {
            console.warn('No JSON array found in Gemini Robotics response:', content);
            return [];
        }

        const jsonString = jsonMatch[1] || jsonMatch[0];
        console.log('Extracted JSON:', jsonString);

        const detections = JSON.parse(jsonString);
        
        // Enhanced validation and formatting for robotics applications
        return detections.map(detection => {
            // Normalize label for robotics consistency
            const normalizedLabel = normalizeRecyclableLabel(detection.label);
            
            // Enhanced bounding box validation for robotics
            const box2d = normalizeBoundingBox(detection.box_2d);
            
            return {
                label: normalizedLabel,
                box_2d: box2d,
                recyclable: detection.recyclable === true && normalizedLabel !== 'Unknown'
            };
        }).filter(detection => {
            // Enhanced filtering for robotic precision requirements
            return detection.label !== 'Unknown' && 
                   Array.isArray(detection.box_2d) && 
                   detection.box_2d.length === 4 &&
                   validateBoundingBox(detection.box_2d) &&
                   detection.recyclable === true;
        });
    } catch (error) {
        console.error('Error parsing Gemini Robotics response:', error);
        console.error('Response data:', JSON.stringify(data, null, 2));
        return [];
    }
}

/**
 * Normalize recyclable item labels for consistency
 */
function normalizeRecyclableLabel(label) {
    if (!label || typeof label !== 'string') return 'Unknown';
    
    const normalized = label.toLowerCase().trim();
    
    // Map common variations to standardized labels
    const labelMappings = {
        'plastic bottle': 'Plastic Bottle',
        'bottle': 'Plastic Bottle',
        'aluminum can': 'Aluminium Can',
        'aluminium can': 'Aluminium Can',
        'can': 'Aluminium Can',
        'glass bottle': 'Glass Bottle',
        'jar': 'Glass Jar',
        'cardboard': 'Cardboard',
        'paper': 'Paper',
        'newspaper': 'Newspaper',
        'magazine': 'Magazine'
    };
    
    // Find matching normalized label
    for (const [key, value] of Object.entries(labelMappings)) {
        if (normalized.includes(key)) {
            return value;
        }
    }
    
    // Check if it's a known recyclable category
    const knownCategories = [
        'Plastic Bottle', 'Aluminium Can', 'Glass Bottle', 'Glass Jar',
        'Cardboard', 'Paper', 'Newspaper', 'Magazine', 'Metal Cap', 'Lid'
    ];
    
    for (const category of knownCategories) {
        if (normalized.includes(category.toLowerCase())) {
            return category;
        }
    }
    
    return 'Unknown';
}

/**
 * Normalize bounding box coordinates for robotics precision
 */
function normalizeBoundingBox(box2d) {
    if (!Array.isArray(box2d) || box2d.length !== 4) {
        return [0, 0, 0, 0];
    }
    
    const [xMin, yMin, width, height] = box2d.map(coord => {
        // Ensure coordinates are numbers and within valid range
        const num = parseFloat(coord);
        if (isNaN(num)) return 0;
        return Math.max(0, Math.min(1, num));
    });
    
    // Ensure valid dimensions for robotic manipulation
    const normalizedWidth = Math.max(0.01, Math.min(1, width));
    const normalizedHeight = Math.max(0.01, Math.min(1, height));
    
    return [xMin, yMin, normalizedWidth, normalizedHeight];
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
