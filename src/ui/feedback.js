import { createConsentSection, setupConsentHandlers } from './consent';

export function createFeedbackSection() {
    return `
    <div class="feedback-section">
      <p>Was this prediction correct?</p>
      ${createConsentSection()}
      <div class="feedback-buttons">
        <button onclick="window.handleFeedback(true)" class="feedback-btn correct" disabled>
          Yes
        </button>
        <button onclick="window.handleFeedback(false)" class="feedback-btn incorrect" disabled>
          No
        </button>
      </div>
    </div>
  `;
}

export function initializeFeedback() {
    const feedbackButtons = document.querySelectorAll('.feedback-btn');
    setupConsentHandlers(feedbackButtons);
}