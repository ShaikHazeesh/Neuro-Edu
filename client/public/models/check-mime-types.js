const http = require('http');
const https = require('https');

// Function to check MIME type of a URL
async function checkMimeType(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      console.log('---');
      
      resolve({
        url,
        status: res.statusCode,
        statusMessage: res.statusMessage,
        contentType: res.headers['content-type']
      });
      
      // Consume response data to free up memory
      res.resume();
    });
    
    req.on('error', (err) => {
      console.error(`Error checking ${url}: ${err.message}`);
      reject(err);
    });
  });
}

// Check MIME types for model files
async function checkModelMimeTypes() {
  const baseUrl = 'http://localhost:5173/models';
  
  const modelFiles = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1'
  ];
  
  for (const file of modelFiles) {
    try {
      await checkMimeType(`${baseUrl}/${file}`);
    } catch (error) {
      console.error(`Failed to check ${file}: ${error.message}`);
    }
  }
}

// Run the checks
checkModelMimeTypes();
