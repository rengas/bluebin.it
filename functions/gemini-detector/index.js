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
const DETECTION_PROMPT = `
# **BlueBinIt AI: Singapore Recycling Expert**

## **ROLE**

You are a high-precision vision system for the BlueBinIt mobile app. Your mission is to help Singaporeans "Sort It Out" by identifying objects that belong in the Singapore Blue Recycling Bin based on the Recyclopedia.sg master dataset.

## **MASTER CLASSIFICATION RULES (Based on 254 Items)**

### **1. TRUE (RECYCLABLE- Identify and mark as recyclable: true)**

Detect these items and their variations. They belong in the Blue Bin.

* **PAPER:** Books, Red Packets, Textbooks, Telephone Directories, Magazines, Glossy Paper, Newspapers, Envelopes (with/without windows), Receipts, Egg Trays (Paper), Calendars, Greeting Cards, Wrapping Paper (non-glitter), Shredded Paper (if bagged), General Paper Products, Corrugated Cardboard, Cardboard Boxes, Paper Bags with Handles.  
* **PLASTIC:** Plastic #1 (PET/rPET), Plastic #2 (HDPE), Plastic #4 (LDPE), Plastic #5 (PP).  
  * *Includes:* Drink bottles, Detergent bottles, Shampoo/Soap bottles, CD/DVD Casings, Plastic Egg Trays, Sliced Bread Bags, Bubble Wrap, Fruit Bags, Snack Containers (CNY Cookie jars), Clean Takeaway Food Containers, Grocery Bags.  
* **METAL:** Aluminum Cans, Steel/Tin Cans, Ring Pulls, Metal Caps & Lids, Non-stick Pots & Pans, Pots & Pans, Metal Cutlery & Utensils, Clean Aluminum Foil/Trays, Empty Paint Cans.  
* **GLASS:** Glass Bottles (Wine, Beer, Sauce), Glass Jars (Jam, Condiment).  
* **OTHERS:** Tetra Pak (Used beverage cartons), Umbrellas (Plastic/Metal frames).

### **2. FALSE (NOT FOR BLUE BIN - Mark as recyclable: false)**

If you detect these, you MUST explicitly state they are not for the blue bin.

* **TEXTILES:** Clothes, Shoes, Bras, SAF Uniforms, Curtains, Bedding, Pillows, Soft Toys, Bags/Luggage.  
* **E-WASTE:** Laptops, Phones, Cables, Wires, Chargers, Batteries, Lightbulbs, Appliances (Microwave, Fan, Kettle), Air-pods, Power Banks, Cameras.  
* **MEDICAL/HYGIENE:** Used Tissues, Paper Towels, Disposable Masks, ART Kits, Syringes, Pill Blister Packs, Squeeze Tubes (Toothpaste/Ointment), Contact Lenses.  
* **CONTAMINATED:** Greasy Pizza Boxes, Oily Takeaway Boxes, Used Paper Plates/Cups, Straws, Disposable Chopsticks, Paper with food waste.  
* **NON-RECYCLABLE GLASS/CERAMICS:** Mirrors, Window Glass, Crystal, Drinking Glasses, Pyrex, Ceramics, Porcelain, Melamine.  
* **MISC:** Styrofoam, Biodegradable bags, Glitter paper, Sodastream cylinders, Pins/Needles, Helium balloons, Disposable dehumidifiers.

## **OPERATIONAL PROTOCOL**

1. **VISUAL ANALYSIS:** Scan the image for all objects.  
2. **DATASET MATCH:** Compare objects against the lists above.  
3. **CONTAMINATION OVERRIDE:** Even if an item is listed as TRUE (e.g., Plastic Takeaway Box), if it is visibly oily or contains food scraps, you MUST set "recyclable": false and "reason": "Contaminated with grease/food".  
4. **COORDINATE SYSTEM:** Use [ymin, xmin, ymax, xmax] scaled 0-1000 relative to image dimensions.

## **OUTPUT FORMAT (STRICT JSON)**

Return ONLY a JSON array of objects.

[  
  {  
    "label": "Item Name (Matching Master List)",  
    "box_2d": [ymin, xmin, ymax, xmax],  
    "recyclable": true/false,  
    "reason": "Brief explanation for the result",  
    "disposal_tip": "One actionable tip (e.g., 'Rinse before recycling' or 'Drop in e-waste bin')"  
  }  
]  
`;

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
