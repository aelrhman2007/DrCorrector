import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppContextType, Settings, OcrResult, AudioSegment, CurrentPlaying } from '../types';

// Create the context with a null default value.
export const AppContext = createContext<AppContextType | null>(null);

// Define the provider component.
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State definitions
  const [settings, setSettingsState] = useState<Settings>(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('drCorrectorSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      answerFormat: 'full',
      questionsPerSegment: 10,
      voice: 'Kore',
      playbackSpeed: 1,
      ttsBackend: 'gemini',
      theme: 'dark',
      autoplay: true,
    };
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<CurrentPlaying | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image preview URL creation and cleanup
  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    setImageRotation(0); // Reset rotation on new image
    // Cleanup function
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);
  
  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('drCorrectorSettings', JSON.stringify(settings));
  }, [settings]);

  // Combined state setter for settings
  const setSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };
  
  const toggleTheme = () => {
    updateSetting('theme', settings.theme === 'light' ? 'dark' : 'light');
  };

  /**
   * Centralized function to play an audio segment.
   * Stops any currently playing audio and starts the new one.
   * @param segment The audio segment to play.
   */
  const playSegment = (segment: AudioSegment) => {
    if (segment.url === '#browser') {
        alert("التشغيل المباشر من هنا غير مدعوم لوضع المتصفح.");
        return;
    }
    
    // Stop any currently playing audio before starting a new one
    if (currentPlaying && currentPlaying.audioElement) {
      currentPlaying.audioElement.pause();
    }
    
    const audioElement = new Audio(segment.url);
    audioElement.playbackRate = settings.playbackSpeed; // Set speed from global settings
    audioElement.play();
    setCurrentPlaying({ segment, audioElement });
  };


  // The context value that will be provided to consumers
  const contextValue: AppContextType = {
    settings,
    imageFile,
    imagePreviewUrl,
    imageRotation,
    ocrResult,
    audioSegments,
    currentPlaying,
    isLoading,
    error,
    theme: settings.theme,
    setSettings,
    updateSetting,
    setImageFile,
    setImageRotation,
    setOcrResult,
    setAudioSegments,
    setCurrentPlaying,
    setIsLoading,
    setError,
    toggleTheme,
    playSegment,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};