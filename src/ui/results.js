
export function displayResult(resultElement, item, isRecyclable, confidence) {
    resultElement.innerHTML = `
  
    <h3>Result:</h3>

    <p>Detected: ${item}</p>
    <p>Confidence: ${(confidence * 100).toFixed(2)}%</p>
    <p style="color: ${isRecyclable ? '#1e8e3e' : '#d93025'}">
      ${isRecyclable ? 'This item can be recycled!' : 'This item should not go in the recycling bin.'}
    </p>
    <div class="feedback-section">
      <p>Was this prediction correct?</p>
      <div class="feedback-buttons">
        <button onclick="window.handleFeedback(true)" class="feedback-btn correct">
          Yes
        </button>
        <button onclick="window.handleFeedback(false)" class="feedback-btn incorrect">
          No
        </button>
      </div>
    </div>
  `;
}