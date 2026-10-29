import React, { useEffect } from 'react';
import type { Room, Player } from '../types/werewolf';
import { ROLE_DETAILS } from '../services/werewolfLogic';
import confetti from 'canvas-confetti';
import { sounds } from '../audio/soundEffects';
import {
  Trophy,
  Moon,
  RotateCcw,
  Users,
  Home,
  Skull,
  User,
  Crown,
} from 'lucide-react';

interface GameOverScreenProps {
  room: Room;
  myPlayer?: Player;
  onPlayAgain: () => Promise<void>;
  onBackToLobby: () => void;
  onBackToHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  room,
  myPlayer,
  onPlayAgain,
  onBackToLobby,
  onBackToHome,
}) => {
  const winner = room.winnerTeam || 'VILLAGERS';
  const isWolvesWin = winner === 'WEREWOLVES';
  const isHost = myPlayer?.isHost || room.hostId === myPlayer?.id;

  useEffect(() => {
    sounds.playVictory();
    // Confetti explosion
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch { }
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 text-slate-200 space-y-6">
      {/* Victory Banner */}
      <div
        className={`p-6 rounded-3xl border text-center shadow-2xl relative overflow-hidden transition-all ${isWolvesWin
            ? 'bg-gradient-to-b from-red-950/80 via-slate-900/90 to-black border-red-600/60 shadow-[0_0_50px_rgba(239,68,68,0.3)]'
            : 'bg-gradient-to-b from-emerald-950/80 via-slate-900/90 to-black border-emerald-600/60 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
          }`}
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border shadow-lg bg-black/50 border-amber-500/50">
          {isWolvesWin ? (
            <Moon className="w-9 h-9 text-red-500" />
          ) : (
            <Trophy className="w-9 h-9 text-amber-400" />
          )}
        </div>

        <span className="text-xs uppercase font-mono tracking-widest text-amber-400 block mb-1">
          KẾT QUẢ CHUNG CUỘC
        </span>

        <h1
          className={`text-2xl md:text-3xl font-black font-cinzel tracking-wider ${isWolvesWin ? 'text-red-400' : 'text-emerald-400'
            }`}
        >
          {isWolvesWin ? 'PHE MA SÓI CHIẾN THẮNG!' : 'PHE DÂN LÀNG CHIẾN THẮNG!'}
        </h1>

        <p className="mt-3 text-xs md:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {room.winReason || 'Ván đấu đã kết thúc với chiến thắng đầy kịch tính!'}
        </p>
      </div>

      {/* Complete Role Revelation Roster */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" /> Danh tính thật của tất cả người chơi
          </span>
          <span className="text-amber-300 font-mono">Đã tiết lộ 100%</span>
        </div>

        <div className="space-y-2">
          {room.players.map((p) => {
            const role = p.role || 'VILLAGER';
            const roleInfo = ROLE_DETAILS[role];
            const isMe = p.id === myPlayer?.id;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${roleInfo.borderColor
                  } ${roleInfo.bgColor} ${!p.isAlive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-black/40 border border-slate-700 flex items-center justify-center shrink-0">
                    {!p.isAlive ? (
                      <Skull className="w-4 h-4 text-red-400" />
                    ) : (
                      <User className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                      {isMe && <span className="text-[10px] text-amber-400">(Bạn)</span>}
                      {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {p.isAlive ? 'Còn sống đến cuối' : 'Đã bị loại'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold font-cinzel block ${roleInfo.color}`}>
                    {roleInfo.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{roleInfo.teamName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {isHost && (
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-cinzel text-sm shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> CHƠI LẠI VÁN MỚI
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBackToLobby();
            }}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold font-cinzel text-slate-200 flex items-center justify-center gap-2 transition"
          >
            <Users className="w-4 h-4 text-amber-400" /> Về phòng chờ
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onBackToHome();
            }}
            className="py-3 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-bold font-cinzel text-slate-400 hover:text-white flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};
