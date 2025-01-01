import { clearPreview } from './preview';

export function resetUI() {
    // Clear result section
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '<p>Capture an image to know if something should go to blue bin</p>';

    // Clear preview
    const previewElement = document.querySelector('.preview-container');
    clearPreview(previewElement);

    // Reset app state
    window.appState.currentImageData = null;
    window.appState.currentPrediction = null;
    window.appState.isProcessing = false;
}