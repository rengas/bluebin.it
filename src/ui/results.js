import { createFeedbackSection, initializeFeedback } from './feedback';
import { normalizeBoundingBox } from '../services/gemini';

export function displayResult(resultElement, item, isRecyclable, confidence, detections = []) {
    // If we have detections array, use the new visual system
    if (Array.isArray(detections) && detections.length > 0) {
        displayDetectionResults(resultElement, detections);
    } else {
        // Fallback to text-based results for backward compatibility
        displayTextResult(resultElement, item, isRecyclable, confidence);
    }
}

function displayDetectionResults(resultElement, detections) {
    const recyclableDetections = detections.filter(d => d.recyclable);
    
    resultElement.innerHTML = `
        <h3>Detection Results:</h3>
        <p>Found ${recyclableDetections.length} recyclable item(s):</p>
        <ul style="text-align: left; margin: 10px 0;">
            ${recyclableDetections.map(d => `
                <li style="color: #1e8e3e; margin: 5px 0;">
                    ✓ ${d.label}
                </li>
            `).join('')}
        </ul>
        <p style="color: #1e8e3e; font-weight: bold;">
            These items can be recycled in the Blue Bin!
        </p>
        ${createFeedbackSection()}
    `;
    
    initializeFeedback();
}

function displayTextResult(resultElement, item, isRecyclable, confidence) {
    resultElement.innerHTML = `
    <h3>Result:</h3>
    <p>Detected: ${item}</p>
    <p>Confidence: ${(confidence * 100).toFixed(2)}%</p>
    <p style="color: ${isRecyclable ? '#1e8e3e' : '#d93025'}">
      ${isRecyclable ? 'This item can be recycled!' : 'This item should not go in the recycling bin. Please refer to https://recyclopedia.sg/ for other ways to recycle'}
    </p>
    ${createFeedbackSection()}
  `;

    initializeFeedback();
}

export function drawDetectionsOnPreview(previewContainer, detections, imageWidth, imageHeight) {

    if (!Array.isArray(detections) || detections.length === 0) {
        return;
    }

    // Remove existing overlay
    const existingOverlay = previewContainer.querySelector('.detection-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Find preview image
    const previewImage = previewContainer.querySelector('img');
    if (!previewImage) {
        return;
    }
    


    // Create overlay canvas
    const overlay = document.createElement('canvas');
    overlay.className = 'detection-overlay';
    
    // Get the actual displayed dimensions of the preview image
    const displayWidth = previewImage.offsetWidth || previewImage.naturalWidth;
    const displayHeight = previewImage.offsetHeight || previewImage.naturalHeight;
    const canvasWidth = imageWidth || previewImage.naturalWidth;
    const canvasHeight = imageHeight || previewImage.naturalHeight;
    
    // Calculate scale factors
    const scaleX = displayWidth / canvasWidth;
    const scaleY = displayHeight / canvasHeight;
    
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 10;
        width: ${displayWidth}px;
        height: ${displayHeight}px;
    `;
    
    // Set overlay size to match displayed preview image
    overlay.width = displayWidth;
    overlay.height = displayHeight;

    // Make sure preview container is positioned relative
    previewContainer.style.position = 'relative';
    
    // Add overlay to preview container
    previewContainer.appendChild(overlay);
    
    // Draw bounding boxes
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Style for bounding boxes
    ctx.strokeStyle = '#1e8e3e'; // Green color for recyclable items
    ctx.lineWidth = 3;
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#1e8e3e';
    
    detections.forEach((detection, index) => {
        console.log(`Processing detection ${index}:`, detection);
        if (detection.recyclable && detection.box_2d) {
            // Convert relative coordinates to pixel coordinates using canvas dimensions
            // then scale to display dimensions
            const canvasBox = normalizeBoundingBox(detection.box_2d, canvasWidth, canvasHeight);
            
            // Scale canvas coordinates to display coordinates
            const displayBox = {
                x: canvasBox.x * scaleX,
                y: canvasBox.y * scaleY,
                width: canvasBox.width * scaleX,
                height: canvasBox.height * scaleY
            };
            
            console.log(`Canvas box ${index}:`, canvasBox);
            console.log(`Display box ${index}:`, displayBox);
            
            // Draw bounding box using display coordinates
            ctx.strokeRect(displayBox.x, displayBox.y, displayBox.width, displayBox.height);
            
            // Draw checkmark
            drawCheckmark(ctx, displayBox.x, displayBox.y);
            
            // Draw label
            ctx.fillText(detection.label, displayBox.x + 20, displayBox.y + 15);
        }
    });
    
}

function drawCheckmark(ctx, x, y) {
    const size = 15;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + size/2);
    ctx.lineTo(x + size/2, y + size - 2);
    ctx.lineTo(x + size - 2, y + 2);
    ctx.stroke();
}

export function clearDetectionOverlay(previewContainer) {
    const existingOverlay = previewContainer.querySelector('.detection-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
}
