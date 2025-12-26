import { normalizeBoundingBox } from '../services/gemini';

export function createOverlayCanvas(container, imageWidth, imageHeight) {
    // Remove existing overlay if any
    const existingOverlay = container.querySelector('.detection-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay canvas
    const overlay = document.createElement('canvas');
    overlay.className = 'detection-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';
    
    // Set canvas size to match image
    overlay.width = imageWidth;
    overlay.height = imageHeight;
    
    // Add to container
    container.style.position = 'relative';
    container.appendChild(overlay);
    
    return overlay;
}

export function drawBoundingBoxes(overlay, detections, imageWidth, imageHeight) {
    const ctx = overlay.getContext('2d');
    
    // Clear previous drawings
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Style for bounding boxes
    ctx.strokeStyle = '#1e8e3e'; // Green color for recyclable items
    ctx.lineWidth = 3;
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#1e8e3e';
    
    detections.forEach(detection => {
        if (detection.recyclable && detection.box_2d) {
            // Convert relative coordinates to pixel coordinates
            const box = normalizeBoundingBox(detection.box_2d, imageWidth, imageHeight);
            
            // Draw bounding box
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            // Draw checkmark
            drawCheckmark(ctx, box.x, box.y);
            
            // Draw label
            ctx.fillText(detection.label, box.x + 20, box.y + 15);
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

export function clearOverlay(container) {
    const existingOverlay = container.querySelector('.detection-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
}

export function showDetectionSummary(resultElement, detections) {
    if (detections.length === 0) {
        resultElement.innerHTML = `
            <h3>Result:</h3>
            <p>No recyclable items detected in this image.</p>
            <p style="color: #d93025">
                Make sure recyclable items are clearly visible and well-lit.
            </p>
        `;
        return;
    }
    
    const recyclableCount = detections.filter(d => d.recyclable).length;
    
    resultElement.innerHTML = `
        <h3>Detection Results:</h3>
        <p>Found ${recyclableCount} recyclable item(s):</p>
        <ul style="text-align: left; margin: 10px 0;">
            ${detections.filter(d => d.recyclable).map(d => `
                <li style="color: #1e8e3e; margin: 5px 0;">
                    ✓ ${d.label}
                </li>
            `).join('')}
        </ul>
        <p style="color: #1e8e3e; font-weight: bold;">
            These items can be recycled in the Blue Bin!
        </p>
    `;
}
