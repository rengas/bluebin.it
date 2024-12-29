import { cameraConfig } from '../../config/camera';

export async function setupCamera(videoElement) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: cameraConfig
        });
        videoElement.srcObject = stream;
        videoElement.play();
    } catch (err) {
        console.error('Error accessing camera:', err);
    }
}