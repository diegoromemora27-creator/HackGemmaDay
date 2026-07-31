"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceAssistantPlayerProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
  title?: string;
}

export function VoiceAssistantPlayer({ src, autoPlay = false, className = "", title = "Audio" }: VoiceAssistantPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("Autoplay was prevented:", e);
        });
      }
    }
  }, [autoPlay, src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasStarted(false);
  };

  return (
    <div className={`inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 backdrop-blur px-3 py-2 shadow-sm transition-all duration-300 ${className}`}>
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={src}
        onPlay={() => { setIsPlaying(true); setHasStarted(true); }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95 shadow-md shadow-indigo-600/20"
        aria-label={isPlaying ? "Pausar lectura" : "Reproducir lectura"}
      >
        {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="ml-0.5 fill-current" />}
      </button>

      {/* Animated Waveform */}
      <div className="flex items-center gap-[3px] h-5 px-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full bg-indigo-500/80 transition-all duration-300 ${
              isPlaying ? "animate-voice" : "opacity-40"
            }`}
            style={{
              height: isPlaying ? undefined : "8px",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      {/* Status Text */}
      <span aria-live="polite" className="text-sm text-slate-500 mr-2 font-medium">
        {isPlaying ? "Leyendo" : (hasStarted ? "En pausa" : title)}
      </span>

      <style jsx>{`
        .animate-voice {
          animation: voice 0.9s ease-in-out infinite;
        }

        @keyframes voice {
          0%, 100% { height: 6px; opacity: 0.45; }
          50% { height: 18px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
