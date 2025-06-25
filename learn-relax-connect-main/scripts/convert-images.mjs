import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gamesDir = path.join(__dirname, '..', 'public', 'images', 'games');

async function convertToWebp() {
  try {
    const files = await readdir(gamesDir);
    const svgFiles = files.filter(file => file.endsWith('.svg'));

    for (const file of svgFiles) {
      const svgPath = path.join(gamesDir, file);
      const webpPath = path.join(gamesDir, file.replace('.svg', '.webp'));

      await sharp(svgPath)
        .resize(800, 450)
        .webp({ quality: 90 })
        .toFile(webpPath);

      console.log(`Converted ${file} to WebP format`);
    }
  } catch (error) {
    console.error('Error converting images:', error);
  }
}

convertToWebp();