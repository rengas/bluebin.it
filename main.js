import './style.css';
import { setupCamera } from './src/camera/camera.js';
import { setupClassifier, classifyImage } from './src/classifier';
import { displayResult, showLoading, showError, showFeedbackSuccess } from './src/ui/messages';
import { waitForML5 } from './src/ml5-loader';
import { captureFrame } from './src/capture';
import { saveFeedback } from './src/feedback';

let video;
let canvas;
let classifier;
let isProcessing = false;
let currentPrediction = null;
let currentImageData = null;

async function handleFeedback(isCorrect) {
  if (!currentPrediction || !currentImageData) return;

  const resultElement = document.getElementById('result');

  try {
    await saveFeedback(currentImageData, currentPrediction, isCorrect);
    showFeedbackSuccess(resultElement);

    // Disable feedback buttons after submission
    const feedbackButtons = document.querySelectorAll('.feedback-btn');
    feedbackButtons.forEach(btn => btn.disabled = true);
  } catch (error) {
    showError(resultElement, 'Failed to save feedback. Please try again.');
  }
}

// Make handleFeedback available globally for the onclick handlers
window.handleFeedback = handleFeedback;

function captureImage() {
  if (isProcessing) return;

  const resultElement = document.getElementById('result');

  try {
    isProcessing = true;
    showLoading(resultElement);

    canvas = captureFrame(video, canvas);

    // Store the image data for feedback
    canvas.toBlob(async (blob) => {
      currentImageData = blob;
    }, 'image/jpeg');

    classifyImage(classifier, canvas, (item, isRecyclable, confidence) => {
      currentPrediction = { item, isRecyclable, confidence };
      displayResult(resultElement, item, isRecyclable, confidence);
      isProcessing = false;
    });
  } catch (error) {
    showError(resultElement, 'Failed to process image. Please try again.');
    isProcessing = false;
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  const resultElement = document.getElementById('result');

  try {
    await waitForML5();
    await setupCamera(video);
    classifier = await setupClassifier();

    document.getElementById('captureBtn').addEventListener('click', captureImage);
  } catch (error) {
    showError(resultElement, error.message || 'Failed to initialize. Please refresh the page.');
  }
});