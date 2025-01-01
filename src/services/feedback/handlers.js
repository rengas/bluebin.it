import { showFeedbackSuccess, showError } from '../../ui/messages';
import {saveFeedback} from "./feedback.js";
import {hasStoredConsent} from "../storage/consent.js";
import {resetUI} from "../../ui/cleanup.js";

export async function handleFeedback(isCorrect) {
    const state = window.appState;
    if (!state?.currentImageData || !state?.currentPrediction) return;

    const resultElement = document.getElementById('result');
    const feedbackButtons = document.querySelectorAll('.feedback-btn');

    if (!hasStoredConsent()) {
        showError(resultElement, 'Please provide consent to store the image before submitting feedback.');
        return;
    }

    // Disable buttons while processing
    feedbackButtons.forEach(btn => btn.disabled = true);

    try {
        await saveFeedback(state.currentImageData, state.currentPrediction, isCorrect);
        showFeedbackSuccess(resultElement);
        // Wait 2 seconds to show success message, then reset UI
        setTimeout(() => {
            resetUI();
        }, 2000);
    } catch (error) {
        showError(resultElement, 'Failed to save feedback. Please try again.');
        // Re-enable buttons on error
        feedbackButtons.forEach(btn => btn.disabled = false);
    }
}