import './style.css';
import { setupCamera } from './src/camera';
import { setupClassifier, classifyImage } from './src/classifier';
import { displayResult, showLoading, showError } from './src/ui';
import { waitForML5 } from './src/ml5-loader';
import { captureFrame } from './src/capture';

let video;
let canvas;
let classifier;
let isProcessing = false;

function captureImage() {
  if (isProcessing) return;
  
  const resultElement = document.getElementById('result');
  
  try {
    isProcessing = true;
    showLoading(resultElement);
    
    captureFrame(video, canvas);
    
    classifyImage(classifier, canvas, (item, isRecyclable, confidence) => {
      displayResult(resultElement, item, isRecyclable, confidence);
      isProcessing = false;
    });
  } catch (error) {
    showError(resultElement, 'Failed to process image. Please try again.');
    isProcessing = false;
  }
}

// Initialize everything when the page loads
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