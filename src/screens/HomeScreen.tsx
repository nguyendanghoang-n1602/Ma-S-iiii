import React, { useState } from 'react';
import { User, Plus, LogIn, Dices, BookOpen, Database, Sparkles, Shield, Moon } from 'lucide-react';
import { sounds } from '../audio/soundEffects';
import { getSavedPlayerName, savePlayerName } from '../services/supabaseClient';

interface HomeScreenProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (playerName: string) => void;
  onOpenRules: () => void;
  onOpenConfig: () => void;
  backendMode: 'SUPABASE' | 'LOCAL';
}

const SAMPLE_NAMES = [
  'Thợ Săn Hắc Ám',
  'Cô Bé Quàng Khăn Đỏ',
  'Lão Trưởng Làng',
  'Thầy Bói Mù',
  'Gã Tiều Phu',
  'Nàng Phù Thủy',
  'Kỵ Sĩ Ánh Trăng',
  'Dân Làng Lương Thiện',
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onOpenRules,
  onOpenConfig,
  backendMode,
}) => {
  const [playerName, setPlayerName] = useState(getSavedPlayerName() || 'Dân Làng');

  const handleRandomName = () => {
    sounds.playClick();
    const chosen = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    setPlayerName(chosen);
    savePlayerName(chosen);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    savePlayerName(e.target.value);
  };

  const handleCreate = () => {
    sounds.playClick();
    onCreateRoom(playerName.trim() || 'Chủ Làng');
  };

  const handleJoin = () => {
    sounds.playClick();
    onJoinRoom(playerName.trim() || 'Khách');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-60px)]">
      {/* Hero Wolf Logo Badge */}
      <div className="relative mb-6 text-center">
        <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto rounded-3xl p-1 bg-gradient-to-b from-amber-500/40 via-indigo-500/20 to-transparent shadow-[0_0_40px_rgba(250,204,21,0.25)]">
          <img
            src="/icon-512.png"
            alt="Làng Sói"
            className="w-full h-full object-cover rounded-[22px] border border-amber-500/50"
          />
        </div>
        <div className="mt-4 space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-cinzel tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 drop-shadow-md">
            LÀNG SÓI
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
            Werewolf Online Multiplayer
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-5">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Tên nhân vật của bạn
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              maxLength={24}
              value={playerName}
              onChange={handleNameChange}
              placeholder="Nhập tên của bạn..."
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-black/50 border border-slate-700 focus:border-amber-500 focus:outline-none text-slate-100 font-semibold text-sm transition"
            />
            <button
              type="button"
              onClick={handleRandomName}
              title="Đổi tên ngẫu nhiên"
              className="absolute right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
            >
              <Dices className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCreate}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-cinzel text-sm shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" /> TẠO PHÒNG MỚI
          </button>

          <button
            onClick={handleJoin}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-amber-500/50 text-slate-100 font-bold font-cinzel text-sm shadow-md flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <LogIn className="w-5 h-5 text-amber-400" /> THAM GIA PHÒNG CÓ SẴN
          </button>
        </div>

        {/* Feature quick links */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={onOpenRules}
            className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-xs text-slate-300 hover:text-amber-300 flex items-center justify-center gap-1.5 transition"
          >
            <BookOpen className="w-4 h-4 text-amber-400" /> Luật chơi
          </button>

          <button
            onClick={onOpenConfig}
            className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-xs text-slate-300 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition"
          >
            <Database className="w-4 h-4 text-indigo-400" /> Kết nối Backend
          </button>
        </div>
      </div>

      {/* Highlights / Badges */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Moon className="w-3.5 h-3.5 text-red-400" /> Đêm huyền bí
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-blue-400" /> Bảo mật vai trò
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Realtime 100%
        </span>
      </div>

      {/* Status & Version Footer */}
      <div className="mt-4 text-center space-y-1">
        <p className="text-[11px] text-slate-500">
          Chế độ: <span className="font-semibold text-slate-400">{backendMode === 'SUPABASE' ? 'Supabase Realtime Cloud' : 'Sandbox Simulator Multi-tab'}</span>
        </p>
        <p className="text-[10px] text-slate-600 font-mono">
          Phiên bản v1.0.0 — Làng Sói (Bản chính thức)
        </p>
      </div>
    </div>
  );
};
