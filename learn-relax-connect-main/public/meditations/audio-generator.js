// Create an audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to create a meditation sound
function createMeditationSound(duration, frequency = 432) {
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Create a calming sine wave with fade in/out
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Fade in first 2 seconds, fade out last 2 seconds
    const fadeIn = Math.min(1, t / 2);
    const fadeOut = Math.min(1, (duration - t) / 2);
    const fade = Math.min(fadeIn, fadeOut);
    
    // Base frequency modulation
    const f = frequency + Math.sin(2 * Math.PI * 0.1 * t) * 2;
    data[i] = Math.sin(2 * Math.PI * f * t) * 0.5 * fade;
  }

  return buffer;
}

// Function to convert AudioBuffer to WAV
function bufferToWav(buffer) {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Audio data
  const samples = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate meditation sounds
const durations = {
  breathing: 300, // 5 minutes
  relaxation: 600, // 10 minutes
  focus: 900 // 15 minutes
};

const frequencies = {
  breathing: 432, // Calming frequency
  relaxation: 396, // Relaxation frequency
  focus: 528 // Focus frequency
};

// Generate and download files
Object.entries(durations).forEach(([type, duration]) => {
  const buffer = createMeditationSound(duration, frequencies[type]);
  const wav = bufferToWav(buffer);
  const url = URL.createObjectURL(wav);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}.mp3`;
  link.click();
  URL.revokeObjectURL(url);
}); 