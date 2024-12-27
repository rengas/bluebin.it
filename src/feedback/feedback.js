import { saveToLocalStorage, getAllFeedback } from '../storage/localStore';

export async function saveFeedback(imageData, prediction, isCorrect) {
    try {
        // Convert image blob to base64 for local storage
        const base64Image = await blobToBase64(imageData);

        const feedback = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            image: base64Image,
            prediction: {
                item: prediction.item,
                isRecyclable: prediction.isRecyclable,
                confidence: prediction.confidence
            },
            isCorrect
        };

        const existingFeedback = getAllFeedback();
        existingFeedback.push(feedback);

        const success = saveToLocalStorage('recycling-feedback', existingFeedback);
        if (!success) throw new Error('Failed to save feedback');

        return feedback;
    } catch (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}