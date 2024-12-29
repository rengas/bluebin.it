import {uploadImage} from "../storage/cloudstorage.js";

export async function saveFeedback(imageData, prediction, isCorrect) {
    try {
        const feedback = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            image: imageData,
            prediction: {
                item: prediction.item,
                isRecyclable: prediction.isRecyclable,
                confidence: prediction.confidence,
            },
            isCorrect:isCorrect,
        };



        const success = uploadImage(feedback);
        if (!success) throw new Error('Failed upload image');



        return feedback;
    } catch (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }
}
