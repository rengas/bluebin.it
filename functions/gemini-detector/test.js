const fs = require('fs');
const path = require('path');

// Simple test for the cloud function
async function testCloudFunction() {
    console.log('Testing Gemini Cloud Function...');
    
    try {
        // Check if we can connect to the local function
        const response = await fetch('http://localhost:8080/health');
        
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        
        const healthData = await response.json();
        console.log('✓ Health check passed:', healthData);
        
        // Test with a sample base64 image (1x1 pixel JPEG)
        const sampleImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        console.log('Testing image analysis...');
        
        const analysisResponse = await fetch('http://localhost:8080/analyzeImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: sampleImageBase64
            })
        });
        
        if (!analysisResponse.ok) {
            const errorData = await analysisResponse.json();
            throw new Error(`Analysis failed: ${analysisResponse.status} - ${JSON.stringify(errorData)}`);
        }
        
        const analysisData = await analysisResponse.json();
        console.log('✓ Image analysis completed:', analysisData);
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nMake sure the cloud function is running locally:');
        console.log('  cd functions/gemini-detector');
        console.log('  npm install');
        console.log('  npm start');
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testCloudFunction();
}

module.exports = { testCloudFunction };
