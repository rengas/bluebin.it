import { cameraConfig } from '../config.js';
import {initImageCapture} from "./imageCapture.js";
export async function setupCamera(videoElement) {
  try {
    // Request camera access with fallback resolutions
    const stream = await navigator.mediaDevices.getUserMedia({
      video: cameraConfig
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    // Initialize ImageCapture with the video track
    const videoTrack = stream.getVideoTracks()[0];
    await initImageCapture(videoTrack);

    return stream;
  } catch (err) {
    console.error('Error accessing camera:', err);
    throw err;
  }
}