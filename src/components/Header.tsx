import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Database, Smartphone, Globe, Server } from 'lucide-react';
import { sounds } from '../audio/soundEffects';
import { type BackendMode } from '../services/gameService';

interface HeaderProps {
  backendMode: BackendMode;
  onOpenRules: () => void;
  onOpenConfig: () => void;
  onOpenInstall: () => void;
  deferredPrompt: any;
}

export const Header: React.FC<HeaderProps> = ({
  backendMode,
  onOpenRules,
  onOpenConfig,
  onOpenInstall,
  deferredPrompt,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sounds.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0a0e1a]/90 backdrop-blur-md border-b border-slate-800/80 px-3 md:px-6 py-2.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-500/50 shadow-sm shrink-0">
          <img src="/favicon.svg" alt="Làng Sói" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-extrabold font-cinzel text-amber-300 leading-none tracking-wide">
            LÀNG SÓI
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            Werewolf Online
          </p>
        </div>
      </div>

      {/* Controls & Quick Badges */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Backend mode indicator */}
        <button
          onClick={onOpenConfig}
          title="Nhấn để đổi cấu hình kết nối"
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border transition ${backendMode === 'SUPABASE'
            ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
            : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}
        >
          {backendMode === 'SUPABASE' ? (
            <>
              <Globe className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Supabase Cloud</span>
            </>
          ) : (
            <>
              <Server className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Sandbox Demo</span>
            </>
          )}
        </button>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className={`p-1.5 rounded-lg border transition ${isMuted
            ? 'bg-slate-900 border-slate-800 text-slate-500'
            : 'bg-slate-900/80 border-slate-700 text-amber-400 hover:border-amber-500'
            }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Rules Guide */}
        <button
          onClick={onOpenRules}
          title="Xem luật chơi"
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Backend Config */}
        <button
          onClick={onOpenConfig}
          title="Cấu hình Supabase"
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-indigo-300 hover:border-indigo-500/40 transition"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* PWA Install Button */}
        <button
          onClick={onOpenInstall}
          title="Cài đặt PWA lên điện thoại"
          className={`p-1.5 rounded-lg border transition ${deferredPrompt
            ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
            : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
