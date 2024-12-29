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
      <p>${message}</p>
    </div>
  `;
}

export function showFeedbackSuccess(element) {
    element.innerHTML += `
    <div class="feedback-success">
      <p>Thank you for your feedback!</p>
    </div>
  `;
}