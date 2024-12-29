// Image preview component
export function showPreview(previewElement, imageData) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(imageData);
    img.className = 'preview-image';

    // Clear previous preview
    previewElement.innerHTML = '';
    previewElement.appendChild(img);

    // Clean up object URL when image loads
    img.onload = () => URL.revokeObjectURL(img.src);
}

export function clearPreview(previewElement) {
    previewElement.innerHTML = '<p>No image captured yet</p>';
}