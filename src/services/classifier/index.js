import { geminiClient, convertCanvasToBase64 } from '../gemini';

let geminiInstance = null;

export async function setupClassifier() {
    // Initialize and verify Gemini client configuration
    if (!geminiInstance) {
        geminiInstance = geminiClient;
        
        // Check if the cloud function is properly configured
        if (!geminiInstance.isConfigured()) {
            console.warn('Gemini cloud function is not configured. Please check environment variables.');
            
            // Try to get configuration info for debugging
            const configInfo = geminiInstance.getConfigInfo();
            console.info('Current configuration:', configInfo);
        }
    }
    return geminiInstance;
}

export async function classifyImage(classifier, canvas, callback) {
    try {
        // Convert canvas to base64 for cloud function
        const base64Image = await convertCanvasToBase64(canvas);
        
        // Analyze image with cloud function
        const detections = await classifier.analyzeImage(base64Image);
        
        // Process the results
        if (detections && detections.length > 0) {
            // Return the first detection for backward compatibility
            // The new UI will handle multiple detections
            const firstDetection = detections[0];
            callback(
                firstDetection.label, 
                firstDetection.recyclable, 
                1.0, // Cloud function doesn't provide confidence scores in the same way
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
        
        // Provide more specific error messages based on the error type
        let errorMessage = 'Error analyzing image';
        if (error.message.includes('Cloud function URL not configured')) {
            errorMessage = 'Service not configured. Please contact administrator.';
        } else if (error.message.includes('External service error')) {
            errorMessage = 'AI service temporarily unavailable. Please try again.';
        } else if (error.message.includes('Invalid request')) {
            errorMessage = 'Invalid image format. Please try again.';
        } else if (error.message.includes('Server error')) {
            errorMessage = 'Server error. Please try again later.';
        }
        
        // Fallback to indicate error
        callback(
            errorMessage, 
            false, 
            0.0,
            []
        );
    }
}

// Health check function for the classifier
export async function checkClassifierHealth() {
    try {
        if (!geminiInstance) {
            await setupClassifier();
        }
        return await geminiInstance.healthCheck();
    } catch (error) {
        console.error('Classifier health check failed:', error);
        return false;
    }
}

// Get classifier configuration information
export function getClassifierInfo() {
    if (!geminiInstance) {
        return { configured: false, error: 'Classifier not initialized' };
    }
    return geminiInstance.getConfigInfo();
}
