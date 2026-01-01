import { setupCamera } from '../services/camera';
import { setupClassifier } from '../services/classifier';
import { captureImage } from '../services/capture';
import { handleFeedback } from '../services/feedback/handlers';

// State management for the home page
const state = {
    isProcessing: false,
    currentImageData: null,
    currentPrediction: null,
    currentDetections: []
};

// Make state globally accessible for feedback handling
window.appState = state;

// Make handleFeedback globally accessible for the onclick handlers
window.handleFeedback = handleFeedback;

export function home() {
    return `
    <div class="main-content">
      <h3 style="color: #c41e1a">Prediction is based on AI model and its prone to errors.
        In doubt Always refer to <a href="https://www.nea.gov.sg/docs/default-source/our-services/waste-management/list-of-items-that-are-recyclable-and-not.PDF">NEA Singapore guidlines on bloobin</a></h3>
      <div class="camera-section">
        <div class="camera-container">
          <video id="video" playsinline></video>
          <canvas id="canvas"></canvas>
        </div>
        <div class="preview-container">
          <p>No image captured yet</p>
        </div>
      </div>
      <div class="capture-controls">
        <button id="captureBtn">Capture Image</button>
      </div>
      <div class="results-section">
        <div id="result" class="result">
          <p>Capture an image to analyze recyclability</p>
        </div>
      </div>
    </div>
  `;
}

export async function initHome() {
    try {
        // Initialize camera
        const video = document.getElementById('video');
        await setupCamera(video);

        // Initialize ML classifier
        const classifier = await setupClassifier();

        // Setup capture button
        const captureBtn = document.getElementById('captureBtn');
        captureBtn.addEventListener('click', () => {
            // Test with lower resolution (50% scale) and lower quality for smaller file sizes
            // You can adjust these values: scaleFactor (0.1-1.0), quality (0.1-1.0)
            const options = {
                scaleFactor: 0.5,  // Half resolution for faster processing
                quality: 0.7       // Slightly lower JPEG quality for smaller files
            };
            
            console.log('Testing lower resolution capture with options:', options);
            captureImage(video, document.getElementById('canvas'), classifier, state, options);
        });

        // Re-assign handleFeedback to window after page initialization
        window.handleFeedback = handleFeedback;
    } catch (error) {
        console.error('Failed to initialize home page:', error);
    }
}
