const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'public', 'images', 'games');
const games = ['subway-surfers', 'temple-run', 'tetris', 'flow', 'zen-garden'];

async function convertToWebp() {
  for (const game of games) {
    const svgPath = path.join(gamesDir, `${game}.svg`);
    const webpPath = path.join(gamesDir, `${game}.webp`);
    
    try {
      // Convert SVG to PNG first (sharp handles this internally)
      await sharp(svgPath)
        .resize(800, 450)
        .webp({ quality: 90 })
        .toFile(webpPath);
      
      console.log(`Converted ${game}.svg to WebP format`);
    } catch (error) {
      console.error(`Error converting ${game}.svg:`, error);
    }
  }
}

convertToWebp();