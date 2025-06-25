const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname);

// Create the models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// List of model files to download
const modelFiles = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',

  // SSD MobileNet
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',

  // Face Landmark
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',

  // Face Expression
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// Base URL for the model files
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

// Download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);

    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all model files
async function downloadAllModels() {
  // First, remove any existing model files to avoid corruption
  for (const modelFile of modelFiles) {
    const filePath = path.join(modelsDir, modelFile);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Removed existing file: ${modelFile}`);
      } catch (error) {
        console.error(`Error removing file ${modelFile}:`, error);
      }
    }
  }

  // Now download fresh copies
  for (const modelFile of modelFiles) {
    const url = baseUrl + modelFile;
    const filePath = path.join(modelsDir, modelFile);

    try {
      await downloadFile(url, filePath);
    } catch (error) {
      console.error(`Error downloading ${modelFile}:`, error);
    }
  }

  console.log('All model files downloaded successfully!');
}

// Start downloading
downloadAllModels();
