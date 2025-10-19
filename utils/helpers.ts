/**
 * Decodes a Base64 string into a Uint8Array.
 * This is a required step before processing the raw audio data from the API.
 * @param base64 The Base64 encoded string.
 * @returns A Uint8Array of the decoded data.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts raw PCM audio data (as Uint8Array) into an AudioBuffer that can be played by the Web Audio API.
 * @param data The raw audio data.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini TTS).
 * @param numChannels The number of audio channels (typically 1 for mono).
 * @returns A promise that resolves with the decoded AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * Writes a string to a DataView.
 * @param view The DataView to write to.
 * @param offset The offset to start writing at.
 * @param str The string to write.
 */
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Creates a WAV file Blob from raw PCM audio data.
 * The Gemini TTS API returns raw 16-bit PCM audio at a 24000Hz sample rate.
 * This function wraps that data in a valid WAV header so it can be played in a standard <audio> element.
 * @param pcmData The raw PCM data as an Int16Array.
 * @param sampleRate The sample rate of the audio (e.g., 24000).
 * @returns A Blob representing the WAV file.
 */
export function createWavBlob(pcmData: Int16Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = pcmData.length * 2; // 16-bit = 2 bytes per sample
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // true for little-endian
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write PCM data
  // The PCM data needs to be written as 16-bit little-endian integers.
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}