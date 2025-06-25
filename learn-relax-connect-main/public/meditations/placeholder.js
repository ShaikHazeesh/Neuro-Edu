// Create an audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create a buffer source
const bufferSize = audioContext.sampleRate * 5; // 5 seconds
const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
const data = buffer.getChannelData(0);

// Fill the buffer with white noise
for (let i = 0; i < bufferSize; i++) {
  data[i] = Math.random() * 2 - 1;
}

// Create a source node
const source = audioContext.createBufferSource();
source.buffer = buffer;

// Create a gain node to control volume
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.1; // Set volume to 10%

// Connect nodes
source.connect(gainNode);
gainNode.connect(audioContext.destination);

// Start playing
source.start(); 