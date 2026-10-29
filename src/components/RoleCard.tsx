import React, { useState } from 'react';
import { type Role } from '../types/werewolf';
import { ROLE_DETAILS } from '../services/werewolfLogic';
import { Moon, Eye, Shield, Sparkles, Users, Lock, Unlock, Check } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  isRevealed?: boolean;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isRevealed = true,
  onConfirm,
  showConfirmButton = false,
}) => {
  const [revealed, setRevealed] = useState(isRevealed);
  const info = ROLE_DETAILS[role];

  const renderIcon = () => {
    switch (role) {
      case 'WEREWOLF':
        return <Moon className="w-14 h-14 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" />;
      case 'SEER':
        return <Eye className="w-14 h-14 text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]" />;
      case 'BODYGUARD':
        return <Shield className="w-14 h-14 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]" />;
      case 'WITCH':
        return <Sparkles className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]" />;
      case 'VILLAGER':
      default:
        return <Users className="w-14 h-14 text-amber-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]" />;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      <div
        className={`relative w-full rounded-2xl p-6 border transition-all duration-500 flex flex-col items-center text-center shadow-2xl ${revealed ? `${info.borderColor} ${info.bgColor}` : 'border-slate-800 bg-slate-900/90'
          }`}
      >
        {/* Secret badge */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setRevealed(!revealed)}
            title="Ẩn / Hiện vai trò"
            className="p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-slate-200 transition"
          >
            {revealed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {revealed ? (
          <>
            <div className="my-4 animate-in zoom-in-90 duration-300">{renderIcon()}</div>

            <div className="space-y-1 mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-black/50 border border-slate-700/60 font-semibold tracking-wider text-slate-300">
                {info.teamName.toUpperCase()}
              </span>
              <h2 className={`text-2xl font-black font-cinzel tracking-wider pt-2 ${info.color}`}>
                {info.name}
              </h2>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed mb-4">{info.description}</p>

            <div className="w-full p-3.5 rounded-xl bg-black/40 border border-slate-800/80 text-xs text-left space-y-1">
              <span className="font-bold text-amber-400 block uppercase tracking-wide">
                Nhiệm vụ & Quyền năng:
              </span>
              <p className="text-slate-300">{info.ability}</p>
            </div>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center gap-4 cursor-pointer" onClick={() => setRevealed(true)}>
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-300 font-cinzel">VAI TRÒ ĐANG BỊ ẨN</h3>
              <p className="text-xs text-slate-500 mt-1">Chạm vào đây để xem vai trò bí mật của bạn</p>
            </div>
          </div>
        )}
      </div>

      {showConfirmButton && (
        <button
          onClick={onConfirm}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold font-cinzel text-sm shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95"
        >
          <Check className="w-5 h-5" /> TÔI ĐÃ HIỂU VAI TRÒ
        </button>
      )}
    </div>
  );
};
