// Represents a single parsed answer from the OCR process.
export interface ParsedAnswer {
  q: number;
  answer: string;
  confidence: number;
}

// Represents the full OCR result from the Gemini API.
export interface OcrResult {
  questions: ParsedAnswer[];
  raw_text: string;
}

// Defines the available voices for Text-to-Speech.
// These are official voice names supported by the Gemini TTS API.
export type VoiceOption = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'vindemiatrix' | 'orus' | 'autonoe';

// Represents all user-configurable settings.
export interface Settings {
  answerFormat: 'full' | 'answer_only' | 'compact';
  questionsPerSegment: number;
  voice: VoiceOption;
  playbackSpeed: number;
  ttsBackend: 'gemini' | 'browser';
  theme: 'light' | 'dark';
  autoplay: boolean;
}

// Represents a generated audio segment.
export interface AudioSegment {
  id: string;
  label: string;
  text: string;
  url: string; // Blob URL for local playback
  blob: Blob;
}

// Represents the state of the currently playing audio track.
export interface CurrentPlaying {
  segment: AudioSegment;
  audioElement: HTMLAudioElement;
}

// Defines the shape of the global AppContext.
export interface AppContextType {
  // State
  settings: Settings;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageRotation: number;
  ocrResult: OcrResult | null;
  audioSegments: AudioSegment[];
  currentPlaying: CurrentPlaying | null;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  
  // Actions
  setSettings: (settings: Settings) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setImageFile: (file: File | null) => void;
  setImageRotation: (rotation: number) => void;
  setOcrResult: (result: OcrResult | null) => void;
  setAudioSegments: (segments: AudioSegment[]) => void;
  setCurrentPlaying: (playing: CurrentPlaying | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleTheme: () => void;
  playSegment: (segment: AudioSegment) => void;
}