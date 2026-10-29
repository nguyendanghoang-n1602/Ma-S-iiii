import React, { useEffect } from 'react';
import type { Player } from '../types/werewolf';
import { RoleCard } from '../components/RoleCard';
import { sounds } from '../audio/soundEffects';

interface RoleRevealScreenProps {
  myPlayer?: Player;
  onProceed: () => void;
}

export const RoleRevealScreen: React.FC<RoleRevealScreenProps> = ({
  myPlayer,
  onProceed,
}) => {
  useEffect(() => {
    if (myPlayer?.role === 'WEREWOLF') {
      sounds.playWolfHowl();
    } else if (myPlayer?.role === 'SEER') {
      sounds.playSeerChime();
    } else if (myPlayer?.role === 'BODYGUARD') {
      sounds.playShieldClang();
    } else if (myPlayer?.role === 'WITCH') {
      sounds.playPotionSound();
    } else {
      sounds.playClick();
    }
  }, [myPlayer?.role]);

  if (!myPlayer?.role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        Đang phân chia vai trò bí mật...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400">
          GIAI ĐOẠN BÍ MẬT
        </span>
        <h2 className="text-2xl font-black font-cinzel text-amber-300">VAI TRÒ CỦA BẠN</h2>
        <p className="text-xs text-slate-400">
          Hãy giữ bí mật danh tính và nhiệm vụ này trước những người chơi khác!
        </p>
      </div>

      <RoleCard
        role={myPlayer.role}
        isRevealed={true}
        showConfirmButton={true}
        onConfirm={() => {
          sounds.playClick();
          onProceed();
        }}
      />
    </div>
  );
};
