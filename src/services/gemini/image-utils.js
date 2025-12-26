// Utility functions for image processing

export function convertBlobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function convertCanvasToBase64(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            try {
                const base64 = await convertBlobToBase64(blob);
                resolve(base64);
            } catch (error) {
                reject(error);
            }
        }, 'image/jpeg', 0.9);
    });
}

export function normalizeBoundingBox(box2d, imageWidth, imageHeight) {
    const [xMin, yMin, width, height] = box2d;
    
    // Convert relative coordinates (0.0 to 1.0) to pixel coordinates
    return {
        x: xMin * imageWidth,
        y: yMin * imageHeight,
        width: width * imageWidth,
        height: height * imageHeight
    };
}

export function validateBoundingBox(box2d) {
    if (!Array.isArray(box2d) || box2d.length !== 4) {
        return false;
    }
    
    const [xMin, yMin, width, height] = box2d;
    
    // Check if values are between 0 and 1
    return xMin >= 0 && xMin <= 1 && 
           yMin >= 0 && yMin <= 1 && 
           width > 0 && width <= 1 && 
           height > 0 && height <= 1;
}
