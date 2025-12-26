// Google Cloud Gemini API Client
import { GEMINI_CONFIG, getApiKey, isApiKeyConfigured } from '../../config/gemini.js';

export class GeminiClient {
    constructor() {
        this.apiKey = getApiKey();
        this.apiEndpoint = GEMINI_CONFIG.API_ENDPOINT;
        this.generationConfig = GEMINI_CONFIG.GENERATION_CONFIG;
    }

    async analyzeImage(imageBase64) {
        try {
            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: GEMINI_CONFIG.DETECTION_PROMPT
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: imageBase64
                            }
                        }
                    ]
                }],
                generationConfig: this.generationConfig
            };

            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
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
            return this.parseResponse(data);
        } catch (error) {
            console.error('Error analyzing image with Gemini:', error);
            throw error;
        }
    }

    parseResponse(data) {
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
                       detection.box_2d.length === 4;
            });
        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            return [];
        }
    }

    // Method to check if API key is configured
    isConfigured() {
        return isApiKeyConfigured();
    }

    // Method to update API key
    updateApiKey(newApiKey) {
        this.apiKey = newApiKey;
    }
}

// Export singleton instance
export const geminiClient = new GeminiClient();
