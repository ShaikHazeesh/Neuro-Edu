const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Base URL for the models
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Models to download
const MODELS = [
  // TinyFaceDetector
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  
  // SSD MobileNet
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'ssd_mobilenetv1_model-weights_manifest.json',
  
  // Face Landmark Model
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  
  // Face Expression Model
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json'
];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');

// Download a file
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${outputPath}...`);
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} successfully!`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Main function
async function main() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      await mkdir(OUTPUT_DIR, { recursive: true });
      console.log(`Created directory: ${OUTPUT_DIR}`);
    }
    
    // Download all models
    const downloads = MODELS.map(model => {
      const url = `${BASE_URL}/${model}`;
      const outputPath = path.join(OUTPUT_DIR, model);
      return downloadFile(url, outputPath);
    });
    
    await Promise.all(downloads);
    
    console.log('All models downloaded successfully!');
    
    // Create a README file
    const readmePath = path.join(OUTPUT_DIR, 'README.md');
    const readmeContent = `# Face-API.js Models

These models are used for face detection, landmark detection, and expression recognition.

Downloaded from: ${BASE_URL}
Date: ${new Date().toISOString()}

## Models Included
- TinyFaceDetector
- SSD MobileNet
- Face Landmark Model
- Face Expression Model

To update these models, run: \`node scripts/download-face-models.js\`
`;
    
    await writeFile(readmePath, readmeContent);
    console.log(`Created README file: ${readmePath}`);
    
  } catch (error) {
    console.error('Error downloading models:', error);
    process.exit(1);
  }
}

main();
