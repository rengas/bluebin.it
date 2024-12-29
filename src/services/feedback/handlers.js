import { showFeedbackSuccess, showError } from '../../ui/messages';
import {saveFeedback} from "./feedback.js";

export async function handleFeedback(isCorrect) {
    const state = window.appState;
    if (!state?.currentImageData || !state?.currentPrediction) return;

    const resultElement = document.getElementById('result');
    const feedbackButtons = document.querySelectorAll('.feedback-btn');

    // Disable buttons while processing
    feedbackButtons.forEach(btn => btn.disabled = true);

    try {
        await saveFeedback(state.currentImageData, state.currentPrediction, isCorrect);
        showFeedbackSuccess(resultElement);
    } catch (error) {
        showError(resultElement, 'Failed to save feedback. Please try again.');
        // Re-enable buttons on error
        feedbackButtons.forEach(btn => btn.disabled = false);
    }
}