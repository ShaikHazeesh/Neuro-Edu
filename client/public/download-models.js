const fs = require('fs');
const path = require('path');
const https = require('https');

// Create models directory if it doesn't exist
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('Created models directory:', modelsDir);
}

// List of model files to download
const modelFiles = [
  // Tiny Face Detector
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  
  // Face Landmark Detection
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  
  // Face Expression
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
  
  // SSD MobileNet
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'ssd_mobilenetv1_model-weights_manifest.json'
];

// Base URL for models
const baseUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

// Download each model file
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => {}); // Delete the file on error
      console.error(`Error downloading ${url}:`, err.message);
      reject(err);
    });
  });
};

// Download all model files
async function downloadAllModels() {
  console.log('Starting model downloads...');
  
  for (const modelFile of modelFiles) {
    const url = baseUrl + modelFile;
    const dest = path.join(modelsDir, modelFile);
    
    try {
      await downloadFile(url, dest);
    } catch (error) {
      console.error(`Failed to download ${modelFile}:`, error);
    }
  }
  
  console.log('All downloads completed!');
  console.log('Models are now available at:', modelsDir);
}

// Run the download
downloadAllModels();
