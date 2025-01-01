import { createFeedbackSection, initializeFeedback } from './feedback';

export function displayResult(resultElement, item, isRecyclable, confidence) {
    resultElement.innerHTML = `
    <h3>Result:</h3>
    <p>Detected: ${item}</p>
    <p>Confidence: ${(confidence * 100).toFixed(2)}%</p>
    <p style="color: ${isRecyclable ? '#1e8e3e' : '#d93025'}">
      ${isRecyclable ? 'This item can be recycled!' : 'This item should not go in the recycling bin. Please refer to https://recyclopedia.sg/ for other ways to recycle'}
    </p>
    ${createFeedbackSection()}
  `;

    initializeFeedback();
}