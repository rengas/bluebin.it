// Google Cloud Gemini API Client (now using Cloud Function)
import { 
    GEMINI_CONFIG, 
    getCloudFunctionUrl, 
    isCloudFunctionConfigured, 
    useLocalFunction 
} from '../../config/gemini.js';

export class GeminiClient {
    constructor() {
        this.cloudFunctionUrl = getCloudFunctionUrl();
        this.isLocal = useLocalFunction();
    }

    async analyzeImage(imageBase64) {
        try {
            // Validate cloud function configuration
            if (!isCloudFunctionConfigured() && !this.isLocal) {
                throw new Error('Cloud function URL not configured. Please set VITE_GEMINI_CLOUD_FUNCTION_URL environment variable.');
            }

            const requestBody = {
                image: imageBase64
            };

            const response = await fetch(this.cloudFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle different types of errors
                if (response.status === 400) {
                    throw new Error(`Invalid request: ${errorData.error || 'Bad request'}`);
                } else if (response.status === 500) {
                    throw new Error(`Server error: ${errorData.error || 'Internal server error'}`);
                } else if (response.status === 502) {
                    throw new Error(`External service error: ${errorData.details || 'Gemini API unavailable'}`);
                } else {
                    throw new Error(`Request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || errorData.details || ''}`);
                }
            }

            const data = await response.json();
            
            // Handle the response format from cloud function
            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            // Return the detections array directly
            return data.detections || [];
            
        } catch (error) {
            console.error('Error analyzing image with Gemini Cloud Function:', error);
            
            // Add context about whether we're using local or production
            const context = this.isLocal ? 'local development' : 'production';
            console.error(`Using ${context} endpoint: ${this.cloudFunctionUrl}`);
            
            throw error;
        }
    }

    // Health check method to verify cloud function is available
    async healthCheck() {
        try {
            const healthUrl = this.cloudFunctionUrl.replace('/analyzeImage', '/health');
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.status === 'healthy';
            
        } catch (error) {
            console.error('Cloud function health check failed:', error);
            return false;
        }
    }

    // Method to check if cloud function is configured
    isConfigured() {
        return isCloudFunctionConfigured() || this.isLocal;
    }

    // Method to get current configuration info
    getConfigInfo() {
        return {
            url: this.cloudFunctionUrl,
            isLocal: this.isLocal,
            configured: this.isConfigured()
        };
    }

    // Method to update cloud function URL (for testing)
    updateCloudFunctionUrl(newUrl) {
        this.cloudFunctionUrl = newUrl;
    }
}

// Export singleton instance
export const geminiClient = new GeminiClient();
