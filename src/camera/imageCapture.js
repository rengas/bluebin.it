// Handle Image Capture API
let imageCapture = null;

// Check if ImageCapture API is supported
const isImageCaptureSupported = typeof ImageCapture !== 'undefined';

export async function initImageCapture(videoTrack) {
    try {
        if (!isImageCaptureSupported) {
            console.warn('ImageCapture API not supported, falling back to canvas capture');
            return null;
        }
        imageCapture = new ImageCapture(videoTrack);
        return imageCapture;
    } catch (error) {
        console.warn('Error initializing ImageCapture:', error);
        return null;
    }
}

export async function takeHighResolutionPhoto() {
    try {
        if (!imageCapture) {
            // Fallback to canvas capture
            console.log("fallback")
            return captureWithCanvas();
        }

        // Take photo with ImageCapture API
        const blob = await imageCapture.takePhoto();
        return blob;
    } catch (error) {
        console.warn('Error taking photo with ImageCapture:', error);
        // Fallback to canvas capture
        return captureWithCanvas();
    }
}

function captureWithCanvas() {
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
    });
}