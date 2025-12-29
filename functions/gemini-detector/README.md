# Gemini Detector Cloud Function

This Google Cloud Function provides a secure API endpoint for detecting recyclable items in images using Google's Gemini AI model.

## Features

- **Secure**: API key is stored securely in Google Cloud environment variables
- **Serverless**: Automatically scales based on demand
- **CORS Support**: Cross-origin requests are enabled for web applications
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Input validation for image data and response format

## API Endpoint

### POST `/analyzeImage`

Analyzes an image and returns detected recyclable items with bounding boxes.

**Request Body:**
```json
{
  "image": "base64-encoded-image-data"
}
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "label": "Plastic Bottle",
      "box_2d": [0.1, 0.2, 0.3, 0.4],
      "recyclable": true
    }
  ],
  "count": 1
}
```

**Error Response:**
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

### GET `/health`

Health check endpoint to verify the function is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-28T10:00:00.000Z",
  "service": "gemini-detector"
}
```

## Local Development

1. **Install dependencies:**
   ```bash
   cd functions/gemini-detector
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

3. **Start local development server:**
   ```bash
   npm start
   ```
   The function will be available at `http://localhost:8080`

4. **Test the function:**
   ```bash
   npm test
   ```

## Deployment

### Using gcloud CLI

1. **Deploy to Google Cloud Functions:**
   ```bash
   npm run deploy
   ```

2. **Set the API key in Google Cloud:**
   ```bash
   gcloud functions deploy analyzeImage \
     --runtime=nodejs20 \
     --trigger-http \
     --allow-unauthenticated \
     --entry-point=analyzeImage \
     --region=us-central1 \
     --set-env-vars=GEMINI_API_KEY=your_api_key_here
   ```

### Using Google Cloud Console

1. Open the Google Cloud Functions console
2. Click "Create Function"
3. Select "HTTP trigger"
4. Upload the function files
5. Set the runtime to Node.js 20
6. Configure environment variables with your Gemini API key
7. Deploy

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

## Security Considerations

- The API key is stored in Google Cloud environment variables, not in the code
- The function is configured to allow unauthenticated access (configure as needed)
- Input validation is performed on all requests
- Error messages are sanitized to avoid exposing sensitive information

## Monitoring and Logging

- View logs in Google Cloud Console under Cloud Functions logs
- Monitor function performance in Cloud Monitoring
- Set up alerts for error rates or response times

## Cost Optimization

- The function uses pay-per-use pricing
- Configure memory allocation based on actual usage
- Set up budgets and alerts in Google Cloud Billing

## Testing

### Local Testing

Create a test file `test.js`:

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

// Test the function with a sample image
async function testFunction() {
  try {
    // Read a test image and convert to base64
    const imageBuffer = fs.readFileSync('test-image.jpg');
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch('http://localhost:8080/analyzeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    });

    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFunction();
```

Run with: `node test.js`

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `GEMINI_API_KEY` environment variable is set
   - Check Google Cloud Console environment variables for the function

2. **CORS Errors**
   - The function includes CORS headers for all origins
   - For production, consider restricting to specific domains

3. **Memory Limits**
   - Increase memory allocation if processing large images
   - Monitor memory usage in Cloud Console

4. **Cold Starts**
   - Functions may have initial latency on first invocation
   - Consider using minimum instances for consistent performance

## Dependencies

- `@google-cloud/functions-framework`: Google Cloud Functions framework
- `node-fetch`: HTTP client for API requests

## License

This function is part of the BlueBin.it recycling detection system.
