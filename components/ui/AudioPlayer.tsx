import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  className?: string;
  variant?: 'default' | 'inverted';
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className = '', variant = 'default' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const setAudioDuration = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (Number(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setProgress(Number(e.target.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isInv = variant === 'inverted';

  return (
    <div className={`flex items-center gap-3 rounded-full px-1 py-1 min-w-[220px] ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button 
        onClick={togglePlay}
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-transform active:scale-95 ${
          isInv ? 'bg-foreground text-background' : 'bg-muted text-foreground border border-border'
        }`}
        type="button"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 pr-3">
        <div className="relative flex items-center h-2 w-full group">
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className={`absolute z-10 w-full h-full opacity-0 cursor-pointer`}
          />
          {/* Custom Track */}
          <div className="absolute w-full h-1 rounded-full bg-muted"></div>
          {/* Custom Progress */}
          <div 
            className="absolute h-1 rounded-full pointer-events-none bg-primary"
            style={{ width: `${progress || 0}%` }}
          ></div>
          {/* Custom Thumb */}
          <div 
            className="absolute h-2.5 w-2.5 rounded-full shadow-sm pointer-events-none transition-transform group-hover:scale-125 bg-primary"
            style={{ left: `calc(${progress || 0}% - 5px)` }}
          ></div>
        </div>
        <div className={`flex justify-between text-[10px] font-medium px-0.5 ${isInv ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
          <span className="tabular-nums tracking-tight">{formatTime(currentTime)}</span>
          <span className="tabular-nums tracking-tight">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
