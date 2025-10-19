import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';

const BottomAudioBar: React.FC = () => {
  const context = useContext(AppContext);
  if (!context || !context.currentPlaying) return null;

  const { currentPlaying, setCurrentPlaying, updateSetting, settings, audioSegments, playSegment } = context;
  const { segment, audioElement } = currentPlaying;

  const [isPlaying, setIsPlaying] = useState(!audioElement.paused);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(audioElement.volume);
  const [playbackRate, setPlaybackRate] = useState(audioElement.playbackRate);

  const progressBarRef = useRef<HTMLInputElement>(null);
  
  // Effect to sync component state with the audio element's state
  useEffect(() => {
    const handleUpdate = () => {
      setIsPlaying(!audioElement.paused);
      if (audioElement.duration > 0) {
        setProgress(audioElement.currentTime / audioElement.duration);
      }
      setVolume(audioElement.volume);
      setPlaybackRate(audioElement.playbackRate);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Autoplay logic
      if (settings.autoplay) {
          const currentIndex = audioSegments.findIndex(s => s.id === segment.id);
          if (currentIndex > -1 && currentIndex < audioSegments.length - 1) {
              const nextSegment = audioSegments[currentIndex + 1];
              playSegment(nextSegment);
          } else {
              // Last track finished, reset to beginning
              audioElement.currentTime = 0;
          }
      } else {
          audioElement.currentTime = 0;
      }
    };


    audioElement.addEventListener('play', handleUpdate);
    audioElement.addEventListener('pause', handleUpdate);
    audioElement.addEventListener('volumechange', handleUpdate);
    audioElement.addEventListener('ratechange', handleUpdate);
    audioElement.addEventListener('timeupdate', handleUpdate);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handleUpdate);
      audioElement.removeEventListener('pause', handleUpdate);
      audioElement.removeEventListener('volumechange', handleUpdate);
      audioElement.removeEventListener('ratechange', handleUpdate);
      audioElement.removeEventListener('timeupdate', handleUpdate);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, settings.autoplay, audioSegments, segment.id, playSegment]);

  const togglePlay = () => {
    if (audioElement.paused) {
      audioElement.play();
    } else {
      audioElement.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value) * audioElement.duration;
    if (!isNaN(newTime)) {
      audioElement.currentTime = newTime;
    }
  };
  
  const skip = (amount: number) => {
    audioElement.currentTime = Math.max(0, Math.min(audioElement.duration, audioElement.currentTime + amount));
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioElement.volume = parseFloat(e.target.value);
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = parseFloat(e.target.value);
    audioElement.playbackRate = newSpeed;
    updateSetting('playbackSpeed', newSpeed); // Update global setting
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-800 shadow-2xl z-50 p-3 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto flex items-center gap-4">
        <div className="w-1/4 flex items-center">
            <h3 className="font-bold truncate">{segment.label}</h3>
        </div>
        <div className="w-1/2 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => skip(-5)} className="text-xl hover:text-blue-500"><i className="fas fa-undo"></i></button>
            <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl shadow-lg">
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button onClick={() => skip(5)} className="text-xl hover:text-blue-500"><i className="fas fa-redo"></i></button>
          </div>
          <div className="w-full flex items-center gap-2 mt-2">
            <span>{formatTime(audioElement.currentTime)}</span>
            <input
              ref={progressBarRef}
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress || 0}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span>{formatTime(audioElement.duration)}</span>
          </div>
        </div>

        <div className="w-1/4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
              <i className="fas fa-volume-down"></i>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-20" />
          </div>
          <select value={playbackRate} onChange={handleSpeedChange} className="bg-gray-300 dark:bg-gray-700 rounded p-1">
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
          <button onClick={() => setCurrentPlaying(null)} className="text-xl hover:text-red-500"><i className="fas fa-times"></i></button>
        </div>
      </div>
    </div>
  );
};

export default BottomAudioBar;