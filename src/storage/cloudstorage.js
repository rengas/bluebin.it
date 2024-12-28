export async function uploadImage(feedback) {

    try {
        // 1. Get the signed URL from your server
        const response = await fetch('https://bluebinit-feedback-713592515357.us-central1.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename:feedback.timestamp }), // Send the desired filename
        });
        const { url } = await response.json();

        // 2. Upload the image using the signed URL
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: feedback.image, // The image file
            headers: {
                'x-goog-meta-item': feedback.prediction.item, // Example metadata
                'x-goog-meta-isRecyclable':  feedback.prediction.isRecyclable,
                'x-goog-meta-confidence': feedback.prediction.confidence,
                'x-goog-meta-isCorrect': feedback.isCorrect,
                'Content-Type': 'application/json'
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