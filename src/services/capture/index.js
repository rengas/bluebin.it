import { showLoading, showError } from '../../ui/messages';
import { showPreview } from '../../ui/preview';
import { displayResult } from '../../ui/results';
import { classifyImage } from '../classifier';

function captureFrame(video, canvas) {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
}

export async function captureImage(video, canvas, classifier, state) {
    if (state.isProcessing) return;

    const resultElement = document.getElementById('result');
    const previewElement = document.querySelector('.preview-container');

    try {
        state.isProcessing = true;
        showLoading(resultElement);

        // Capture frame using canvas
        const blob = await captureFrame(video, canvas);
        state.currentImageData = blob;
        showPreview(previewElement, blob);

        // Create image for classification
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            classifyImage(classifier, img, (item, isRecyclable, confidence) => {
                state.currentPrediction = { item, isRecyclable, confidence };
                displayResult(resultElement, item, isRecyclable, confidence);
                state.isProcessing = false;
            });
            URL.revokeObjectURL(img.src);
        };
    } catch (error) {
        console.error('Error capturing image:', error);
        showError(resultElement, 'Failed to capture image. Please try again.');
        state.isProcessing = false;
    }
}