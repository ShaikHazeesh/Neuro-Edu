import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for the model files
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// List of model files to serve
const MODEL_FILES = [
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

// Create models directory if it doesn't exist
const publicModelsDir = path.join(__dirname, 'client', 'public', 'models');
if (!fs.existsSync(publicModelsDir)) {
  fs.mkdirSync(publicModelsDir, { recursive: true });
}

// Function to download a file
const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`File already exists: ${filePath}`);
      resolve();
      return;
    }
    
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
};

// Download all model files
const downloadAllModels = async () => {
  for (const file of MODEL_FILES) {
    const url = `${BASE_URL}/${file}`;
    const filePath = path.join(publicModelsDir, file);
    
    try {
      await downloadFile(url, filePath);
    } catch (error) {
      console.error(`Error downloading ${file}:`, error);
    }
  }
  
  console.log('All model files downloaded successfully!');
};

// Start downloading
downloadAllModels().then(() => {
  console.log('Done!');
});
