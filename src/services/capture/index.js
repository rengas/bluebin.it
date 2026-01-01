import { showLoading, showError } from '../../ui/messages';
import { showPreview } from '../../ui/preview';
import { displayResult, drawDetectionsOnPreview, clearDetectionOverlay } from '../../ui/results';
import { classifyImage } from '../classifier';
import { geminiClient } from '../gemini';

function captureFrame(video, canvas, scaleFactor = 1.0, quality = 0.9) {
    const context = canvas.getContext('2d');
    
    // Log original video dimensions
    console.log(`Original video dimensions: ${video.videoWidth}x${video.videoHeight}`);
    
    // Apply scaling factor for lower resolution
    canvas.width = Math.floor(video.videoWidth * scaleFactor);
    canvas.height = Math.floor(video.videoHeight * scaleFactor);
    
    console.log(`Capturing at scaled dimensions: ${canvas.width}x${canvas.height} (scale factor: ${scaleFactor})`);
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                console.log(`Captured image size: ${blob.size} bytes (${(blob.size / 1024).toFixed(2)} KB)`);
            }
            resolve(blob);
        }, 'image/jpeg', quality);
    });
}

export async function captureImage(video, canvas, classifier, state, options = {}) {
    if (state.isProcessing) return;

    // Set default options for resolution and quality
    const { scaleFactor = 1.0, quality = 0.9 } = options;
    
    console.log(`Capturing image with options:`, { scaleFactor, quality });

    const resultElement = document.getElementById('result');
    const previewElement = document.querySelector('.preview-container');

    try {
        state.isProcessing = true;
        showLoading(resultElement);
        
        // Clear any existing overlays from preview
        clearDetectionOverlay(previewElement);

        // Check if Gemini API is configured
        if (!geminiClient.isConfigured()) {
            showError(resultElement, `
                <h3>API Configuration Required</h3>
                <p>The recycling detection feature is not currently configured.</p>
                <p>Please contact your system administrator to set up the Gemini API key.</p>
                <p style="color: #666; font-size: 0.9em;">
                    Technical details: VITE_GEMINI_API_KEY environment variable is not set
                </p>
            `);
            state.isProcessing = false;
            return;
        }

        // Capture frame using canvas with configurable resolution and quality
        const blob = await captureFrame(video, canvas, scaleFactor, quality);
        state.currentImageData = blob;
        
        // Show preview image
        showPreview(previewElement, blob);

        // Create image for classification
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        
        img.onload = async () => {
            try {
                // Show enhanced loading state for API calls
                resultElement.innerHTML = `
                    <div class="loading api-call">
                        <div class="loading-spinner"></div>
                        <p>Analyzing image with Gemini AI...</p>
                        <p style="font-size: 0.9em; color: #666;">This may take a few seconds</p>
                    </div>
                `;

                // Classify image with Gemini
                await classifyImage(classifier, canvas, (...args) => {
                    // Handle both individual parameters and object parameter formats
                    let item, isRecyclable, confidence, detections = [];
                    
                    if (args.length === 1 && typeof args[0] === 'object') {
                        // Parameters passed as object
                        const params = args[0];
                        item = params.item;
                        isRecyclable = params.isRecyclable;
                        confidence = params.confidence;
                        detections = params.detections || [];
                    } else {
                        // Parameters passed as individual arguments
                        [item, isRecyclable, confidence, detections] = args;
                    }
                    
                    console.log('Classifier callback received:', { item, isRecyclable, confidence, detections });
                    
                    // Update state with all detections
                    state.currentPrediction = { item, isRecyclable, confidence, detections };
                    
                    // Display results
                    displayResult(resultElement, item, isRecyclable, confidence, detections);
                    
                    // Draw bounding boxes on preview image if we have detections
                    if (Array.isArray(detections) && detections.length > 0) {
                        // Get image dimensions from the captured canvas
                        const imageWidth = canvas.width;
                        const imageHeight = canvas.height;
                        
                        console.log('Calling drawDetectionsOnPreview with:', { detections, imageWidth, imageHeight });
                        
                        // Draw overlay on preview container
                        drawDetectionsOnPreview(previewElement, detections, imageWidth, imageHeight);
                    }
                    
                    state.isProcessing = false;
                });
            } catch (error) {
                console.error('Error during classification:', error);
                
                // Handle different types of errors
                let errorMessage = 'Failed to analyze image. Please try again.';
                if (error.message.includes('API key')) {
                    errorMessage = `
                        <h3>API Configuration Error</h3>
                        <p>There's an issue with the API configuration.</p>
                        <p>Please contact your system administrator.</p>
                    `;
                } else if (error.message.includes('quota')) {
                    errorMessage = `
                        <h3>Service Temporarily Unavailable</h3>
                        <p>The service has reached its usage limit.</p>
                        <p>Please try again later.</p>
                    `;
                } else if (error.message.includes('network')) {
                    errorMessage = `
                        <h3>Connection Error</h3>
                        <p>Unable to connect to the detection service.</p>
                        <p>Please check your internet connection and try again.</p>
                    `;
                }
                
                showError(resultElement, errorMessage);
                state.isProcessing = false;
            }
            
            URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
            console.error('Error loading captured image');
            showError(resultElement, 'Failed to process captured image. Please try again.');
            state.isProcessing = false;
            URL.revokeObjectURL(img.src);
        };
        
    } catch (error) {
        console.error('Error capturing image:', error);
        showError(resultElement, 'Failed to capture image. Please try again.');
        state.isProcessing = false;
    }
}
