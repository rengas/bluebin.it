export function displayResult(resultElement, item, isRecyclable, confidence) {
  resultElement.innerHTML = `
    <h3>Result:</h3>
    <p>Detected: ${item}</p>
    <p>Confidence: ${(confidence * 100).toFixed(2)}%</p>
    <p style="color: ${isRecyclable ? 'green' : 'red'}">
      ${isRecyclable ? 'This item can be recycled!' : 'This item should not go in the recycling bin.'}
    </p>
  `;
}

export function showLoading(element) {
  element.innerHTML = `
    <div class="loading">
      <p>Analyzing image...</p>
    </div>
  `;
}

export function showError(element, message) {
  element.innerHTML = `
    <div class="error">
      <p style="color: red">${message}</p>
    </div>
  `;
}