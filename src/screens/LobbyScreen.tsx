import React, { useState } from 'react';
import type { Room, Player, Role } from '../types/werewolf';
import { ROLE_DETAILS } from '../services/werewolfLogic';
import {
  Copy,
  Check,
  Share2,
  Crown,
  Play,
  LogOut,
  Bot,
  User,
  Users,
  Settings,
  AlertCircle,
  Moon,
  Eye,
  Shield,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface LobbyScreenProps {
  room: Room;
  myPlayer?: Player;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onAddBot: () => Promise<void>;
  isStarting?: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  myPlayer,
  onStartGame,
  onLeaveRoom,
  onAddBot,
  isStarting = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isHost = myPlayer?.isHost || room.hostId === myPlayer?.id;
  const currentCount = room.players.length;
  const maxPlayers = room.settings.maxPlayers;
  const totalRoles = (Object.keys(room.roleDistribution) as Role[]).reduce(
    (sum, r) => sum + (room.roleDistribution[r] || 0),
    0
  );

  const canStart = isHost && currentCount >= 5 && currentCount === totalRoles;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    sounds.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vào chơi Làng Sói cùng tôi!',
          text: `Mã phòng chơi Ma Sói: ${room.code}. Hãy vào tham gia ngay!`,
          url: window.location.href,
        });
      } catch { }
    } else {
      handleCopyCode();
    }
  };

  const handleStartClick = async () => {
    setErrorMsg('');
    if (!canStart) {
      if (currentCount < 5) {
        setErrorMsg('Cần tối thiểu 5 người chơi để bắt đầu ván đấu!');
      } else if (currentCount !== totalRoles) {
        setErrorMsg(
          `Số người chơi hiện tại (${currentCount}) chưa khớp với tổng cấu hình vai trò (${totalRoles})!`
        );
      }
      return;
    }

    try {
      sounds.playClick();
      await onStartGame();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 text-slate-200 space-y-6">
      {/* Room Code Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-950/80 border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 block mb-0.5">
            MÃ PHÒNG CHƠI
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black font-mono tracking-[0.2em] text-amber-300">
              {room.code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã chép' : 'Sao chép'}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-cinzel transition"
          >
            <Share2 className="w-4 h-4" /> Chia sẻ
          </button>
        </div>
      </div>

      {/* Players Seating Grid */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Danh sách người chơi
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 font-mono text-amber-300 font-semibold border border-slate-700">
            {currentCount} / {maxPlayers} người
          </span>
        </div>

        {/* Seats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {room.players.map((p, index) => {
            const isMe = p.id === myPlayer?.id;
            return (
              <div
                key={p.id}
                className={`relative p-3 rounded-xl border flex items-center gap-2.5 transition ${isMe
                  ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-black/40 border-slate-800'
                  }`}
              >
                {/* Seat badge */}
                <span className="absolute -top-2 -left-1.5 text-[10px] w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold flex items-center justify-center">
                  {index + 1}
                </span>

                {/* Avatar Icon */}
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  {p.id.startsWith('bot_') ? (
                    <Bot className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <User className="w-5 h-5 text-amber-400" />
                  )}
                </div>

                {/* Name & Host badge */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {p.name}
                    </span>
                    {p.isHost && (
                      <span title="Chủ phòng">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {isMe ? 'Bạn' : p.id.startsWith('bot_') ? 'AI Bot' : 'Sẵn sàng'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Empty Seats */}
          {Array.from({ length: Math.max(0, maxPlayers - currentCount) }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="p-3 rounded-xl border border-dashed border-slate-800/80 bg-black/20 flex items-center justify-center text-slate-600 text-xs italic"
            >
              Ghế trống #{currentCount + idx + 1}
            </div>
          ))}
        </div>

        {/* Add Bot Action (for instant test) */}
        {currentCount < maxPlayers && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                sounds.playClick();
                onAddBot();
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 flex items-center gap-1.5 transition"
            >
              <Bot className="w-4 h-4 text-indigo-400" /> Thêm Bot chơi thử nhanh
            </button>
          </div>
        )}
      </div>

      {/* Role configuration summary */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-400" /> Bộ vai trò sẽ phát
          </span>
          <span className="font-mono text-slate-300">Tổng: {totalRoles} vai trò</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(room.roleDistribution) as Role[]).map((r) => {
            const count = room.roleDistribution[r] || 0;
            if (count <= 0) return null;
            const info = ROLE_DETAILS[r];

            return (
              <span
                key={r}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${info.borderColor} ${info.bgColor} ${info.color}`}
              >
                {r === 'WEREWOLF' && <Moon className="w-3.5 h-3.5" />}
                {r === 'SEER' && <Eye className="w-3.5 h-3.5" />}
                {r === 'BODYGUARD' && <Shield className="w-3.5 h-3.5" />}
                {r === 'WITCH' && <Sparkles className="w-3.5 h-3.5" />}
                {r === 'VILLAGER' && <Users className="w-3.5 h-3.5" />}
                {info.name}: <strong className="font-mono">{count}</strong>
              </span>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-600/70 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="space-y-3 pt-2">
        {isHost ? (
          <button
            onClick={handleStartClick}
            disabled={!canStart || isStarting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black font-cinzel text-base shadow-[0_0_25px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            {isStarting ? 'ĐANG BẮT ĐẦU VÁN ĐẤU...' : 'BẮT ĐẦU VÁN CHƠI'}
          </button>
        ) : (
          <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 text-center text-xs text-slate-400 italic">
            Đang chờ chủ phòng bắt đầu ván chơi...
          </div>
        )}

        <button
          onClick={() => {
            sounds.playClick();
            onLeaveRoom();
          }}
          className="w-full py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-red-400 flex items-center justify-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4" /> Rời phòng chơi
        </button>
      </div>
    </div>
  );
};
