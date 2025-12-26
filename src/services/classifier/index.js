import { geminiClient, convertCanvasToBase64 } from '../gemini';

let geminiInstance = null;

export async function setupClassifier() {
    // Gemini client is already initialized as singleton
    if (!geminiInstance) {
        geminiInstance = geminiClient;
    }
    return geminiInstance;
}

export async function classifyImage(classifier, canvas, callback) {
    try {
        // Convert canvas to base64 for Gemini API
        const base64Image = await convertCanvasToBase64(canvas);
        
        // Analyze image with Gemini
        const detections = await classifier.analyzeImage(base64Image);
        
        // Process the results
        if (detections.length > 0) {
            // Return the first detection for backward compatibility
            // The new UI will handle multiple detections
            const firstDetection = detections[0];
            callback(
                firstDetection.label, 
                firstDetection.recyclable, 
                1.0, // Gemini doesn't provide confidence scores in the same way
                detections // Pass all detections for the new UI
            );
        } else {
            // No recyclable items detected
            callback(
                'No recyclable items detected', 
                false, 
                0.0,
                []
            );
        }
    } catch (error) {
        console.error('Error in classifyImage:', error);
        // Fallback to indicate error
        callback(
            'Error analyzing image', 
            false, 
            0.0,
            []
        );
    }
}
