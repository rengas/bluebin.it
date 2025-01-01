import {getStoredEmail} from "./consent.js";

export async function uploadImage(feedback) {

    try {


        // 1. Get the signed URL from your server
        const response = await fetch('https://bluebinit-feedback-713592515357.us-central1.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-meta-item':  feedback.prediction.item, // Example metadata
                'x-goog-meta-is-recyclable': feedback.prediction.isRecyclable,
                 'x-goog-meta-confidence': feedback.prediction.confidence,
                 'x-goog-meta-is-correct': feedback.isCorrect,
                 'x-goog-meta-email':  getStoredEmail(),
            },
            body: JSON.stringify({ filename:feedback.timestamp }), // Send the desired filename
        });
        const { url } = await response.json();

        // 2. Upload the image using the signed URL
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: feedback.image, // The image file
            headers: {
                'Content-Type': 'image/jpeg',
                'x-goog-meta-item': feedback.prediction.item,
                'x-goog-meta-is-recyclable': feedback.prediction.isRecyclable,
                 'x-goog-meta-confidence': feedback.prediction.confidence,
                 'x-goog-meta-is-correct': feedback.isCorrect,
                 'x-goog-meta-email':  getStoredEmail(),
            }
        });

        if (!uploadResponse.ok) {
            throw new Error('Image upload failed');
        }

        console.log('Image uploaded successfully!');
    } catch (error) {
        console.error('Error uploading image:', error);
    }
}