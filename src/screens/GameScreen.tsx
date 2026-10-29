import React, { useState, useEffect } from 'react';
import type { Room, Player, ChatMessage, GameAction } from '../types/werewolf';
import { ROLE_DETAILS } from '../services/werewolfLogic';
import { TimerBadge } from '../components/TimerBadge';
import { ChatBox } from '../components/ChatBox';
import { sounds } from '../audio/soundEffects';
import {
  Moon,
  Sun,
  Eye,
  Shield,
  Sparkles,
  Users,
  Skull,
  User,
  Crown,
  Check,
  ChevronRight,
  Heart,
  Crosshair,
} from 'lucide-react';


interface GameScreenProps {
  room: Room;
  myPlayer?: Player;
  messages: ChatMessage[];
  onSubmitNightAction: (
    actionType: GameAction['actionType'],
    targetId?: string | null,
    extraData?: any
  ) => Promise<{ success: boolean; result?: string; message?: string }>;
  onSubmitVote: (targetId: string | null) => Promise<void>;
  onAdvancePhase: () => Promise<void>;
  onSendMessage: (content: string, channel: ChatMessage['channel']) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  myPlayer,
  messages,
  onSubmitNightAction,
  onSubmitVote,
  onAdvancePhase,
  onSendMessage,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const [seerResult, setSeerResult] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleReminder, setShowRoleReminder] = useState(false);

  const phase = room.phase;
  const isNight = phase.startsWith('NIGHT_');
  const isHost = myPlayer?.isHost || room.hostId === myPlayer?.id;
  const isAlive = myPlayer?.isAlive ?? true;
  const myRole = myPlayer?.role;

  // Sound triggers on phase change
  useEffect(() => {
    setSelectedTargetId(null);
    setHasActed(false);
    setActionNotice('');

    if (phase === 'NIGHT_START') {
      sounds.playWolfHowl();
    } else if (phase === 'DAY_ANNOUNCEMENT') {
      sounds.playMorningBell();
    } else if (phase === 'VOTE_RESOLUTION') {
      sounds.playDeathGong();
    }
  }, [phase]);

  // Phase Title & Subtitle in Vietnamese
  const getPhaseInfo = (): { title: string; subtitle: string; icon: React.ReactNode } => {
    switch (phase) {
      case 'NIGHT_START':
        return {
          title: `ĐÊM THỨ ${room.nightCount}`,
          subtitle: 'Màn đêm buông xuống, bóng tối bao trùm ngôi làng...',
          icon: <Moon className="w-5 h-5 text-indigo-400" />,
        };
      case 'NIGHT_WOLVES':
        return {
          title: 'MA SÓI THỨC GIẤC',
          subtitle: 'Đàn sói đang chọn nạn nhân trong bóng đêm...',
          icon: <Moon className="w-5 h-5 text-red-500 animate-pulse" />,
        };
      case 'NIGHT_SEER':
        return {
          title: 'TIÊN TRI SOI BÀI',
          subtitle: 'Quả cầu tiên tri đang soi sáng một tâm hồn...',
          icon: <Eye className="w-5 h-5 text-purple-400" />,
        };
      case 'NIGHT_GUARD':
        return {
          title: 'BẢO VỆ TUẦN TRA',
          subtitle: 'Chiến binh canh gác chọn người che chở đêm nay...',
          icon: <Shield className="w-5 h-5 text-blue-400" />,
        };
      case 'NIGHT_WITCH':
        return {
          title: 'PHÙ THỦY CHẾ THUỐC',
          subtitle: 'Bình thuốc cứu và độc dược đang được cân nhắc...',
          icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
        };
      case 'NIGHT_RESOLUTION':
        return {
          title: 'MÀN ĐÊM KẾT THÚC',
          subtitle: 'Các hành động đang được kết toán trước bình minh...',
          icon: <Moon className="w-5 h-5 text-slate-400" />,
        };
      case 'DAY_ANNOUNCEMENT':
        return {
          title: `BÌNH MINH NGÀY ${room.dayCount}`,
          subtitle: 'Mặt trời lên, cả làng thức giấc điểm danh...',
          icon: <Sun className="w-5 h-5 text-amber-400 animate-spin" />,
        };
      case 'DAY_DISCUSSION':
        return {
          title: `THẢO LUẬN NGÀY ${room.dayCount}`,
          subtitle: 'Dân làng tranh luận tìm ra kẻ khả nghi!',
          icon: <Users className="w-5 h-5 text-amber-400" />,
        };
      case 'DAY_VOTING':
        return {
          title: 'BỎ PHIẾU TREO CỔ',
          subtitle: 'Tất cả người sống hãy bỏ phiếu định đoạt số phận!',
          icon: <Crosshair className="w-5 h-5 text-red-400" />,
        };
      case 'VOTE_RESOLUTION':
        return {
          title: 'KẾT QUẢ PHÁN QUYẾT',
          subtitle: 'Đoạn đầu đài đã sẵn sàng thực thi...',
          icon: <Skull className="w-5 h-5 text-red-500" />,
        };
      default:
        return {
          title: 'ĐANG DIỄN RA',
          subtitle: '',
          icon: <Moon className="w-5 h-5" />,
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  // Handlers for role actions
  const handleWolfKill = async (targetId: string) => {
    setIsSubmitting(true);
    sounds.playClick();
    try {
      const res = await onSubmitNightAction('WOLF_KILL', targetId);
      setSelectedTargetId(targetId);
      setHasActed(true);
      setActionNotice(res.message || 'Đã chọn mục tiêu tấn công.');
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeerInspect = async (targetId: string) => {
    setIsSubmitting(true);
    sounds.playSeerChime();
    try {
      const res = await onSubmitNightAction('SEER_INSPECT', targetId);
      setSelectedTargetId(targetId);
      setHasActed(true);
      setSeerResult(res.result || null);
      setActionNotice(res.message || 'Đã soi bài thành công!');
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuardProtect = async (targetId: string) => {
    setIsSubmitting(true);
    sounds.playShieldClang();
    try {
      const res = await onSubmitNightAction('GUARD_PROTECT', targetId);
      setSelectedTargetId(targetId);
      setHasActed(true);
      setActionNotice(res.message || 'Đã kích hoạt khiên bảo vệ.');
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWitchHeal = async () => {
    setIsSubmitting(true);
    sounds.playPotionSound();
    try {
      const res = await onSubmitNightAction('WITCH_HEAL');
      setHasActed(true);
      setActionNotice(res.message || 'Đã dùng bình thuốc cứu sống nạn nhân!');
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWitchPoison = async (targetId: string) => {
    setIsSubmitting(true);
    sounds.playPotionSound();
    try {
      const res = await onSubmitNightAction('WITCH_POISON', targetId);
      setSelectedTargetId(targetId);
      setHasActed(true);
      setActionNotice(res.message || 'Đã đầu độc mục tiêu!');
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWitchSkip = async () => {
    setIsSubmitting(true);
    sounds.playClick();
    try {
      await onSubmitNightAction('WITCH_SKIP');
      setHasActed(true);
      setActionNotice('Phù thủy bỏ qua lượt đêm nay.');
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (targetId: string | null) => {
    setIsSubmitting(true);
    sounds.playClick();
    try {
      await onSubmitVote(targetId);
      setSelectedTargetId(targetId);
      setHasActed(true);
      setActionNotice(
        targetId
          ? `Bạn đã bỏ phiếu cho ${room.players.find((p) => p.id === targetId)?.name}.`
          : 'Bạn đã bỏ phiếu trắng.'
      );
    } catch (err: any) {
      setActionNotice(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvance = async () => {
    sounds.playClick();
    try {
      await onAdvancePhase();
    } catch { }
  };

  // Determine if current player has an active action in this phase
  const isMyTurnAtNight =
    isAlive &&
    ((phase === 'NIGHT_WOLVES' && myRole === 'WEREWOLF') ||
      (phase === 'NIGHT_SEER' && myRole === 'SEER') ||
      (phase === 'NIGHT_GUARD' && myRole === 'BODYGUARD') ||
      (phase === 'NIGHT_WITCH' && myRole === 'WITCH'));

  const livingPlayers = room.players.filter((p) => p.isAlive);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 md:px-4 py-4 text-slate-200 space-y-4">
      {/* 1. Header Phase & Time Tracker */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-500 shadow-xl ${isNight
          ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900/90 border-indigo-700/40'
          : 'bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-900 border-amber-600/40'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {phaseInfo.icon}
            <div>
              <h2 className="text-base md:text-lg font-black font-cinzel text-amber-300 tracking-wider">
                {phaseInfo.title}
              </h2>
              <p className="text-xs text-slate-300">{phaseInfo.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TimerBadge phaseEndsAt={room.phaseEndsAt} onExpire={handleAdvance} />
          </div>
        </div>

        {/* My Role Quick Tag */}
        {myRole && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Vai trò của bạn:</span>
              <button
                type="button"
                onClick={() => setShowRoleReminder(!showRoleReminder)}
                className={`px-2.5 py-0.5 rounded-full font-bold font-cinzel border ${ROLE_DETAILS[myRole].borderColor} ${ROLE_DETAILS[myRole].bgColor} ${ROLE_DETAILS[myRole].color} hover:opacity-80 transition`}
              >
                {ROLE_DETAILS[myRole].name} {!isAlive && '(Đã chết)'}
              </button>
            </div>

            {isHost && (
              <button
                onClick={handleAdvance}
                className="text-[11px] px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1 transition"
              >
                Chuyển lượt <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Role reminder card dropdown */}
        {showRoleReminder && myRole && (
          <div className="mt-3 p-3 rounded-xl bg-black/60 border border-slate-700 text-xs space-y-1.5 animate-in slide-in-from-top-2">
            <p className="text-slate-200">
              <strong className="text-amber-400">Nhiệm vụ: </strong>
              {ROLE_DETAILS[myRole].description}
            </p>
            <p className="text-slate-300">
              <strong className="text-amber-400">Kỹ năng: </strong>
              {ROLE_DETAILS[myRole].ability}
            </p>
          </div>
        )}
      </div>

      {/* 2. Interactive Role Action Area */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        {/* Case A: Werewolf Night Action */}
        {phase === 'NIGHT_WOLVES' && myRole === 'WEREWOLF' && isAlive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
              <Moon className="w-4 h-4" /> Bầy Sói chọn mục tiêu tấn công đêm nay
            </div>
            <p className="text-xs text-slate-300">
              Chạm vào một người dân làng còn sống để đàn sói thống nhất tiêu diệt:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {livingPlayers
                .filter((p) => p.id !== myPlayer?.id)
                .map((p) => {
                  const isSelected = selectedTargetId === p.id || room.activeNightTarget === p.id;
                  const isWolfAlly = p.role === 'WEREWOLF';
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleWolfKill(p.id)}
                      disabled={isSubmitting}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${isSelected
                        ? 'bg-red-950 border-red-500 text-white ring-2 ring-red-500'
                        : 'bg-black/40 border-slate-800 hover:border-red-600/60 text-slate-300'
                        }`}
                    >
                      <span className="truncate w-full text-center">{p.name}</span>
                      {isWolfAlly && (
                        <span className="text-[10px] text-red-400 font-normal font-mono">
                          (Đồng đội Sói)
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Case B: Seer Night Action */}
        {phase === 'NIGHT_SEER' && myRole === 'SEER' && isAlive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Eye className="w-4 h-4" /> Chọn một người còn sống để soi danh tính
            </div>
            <p className="text-xs text-slate-300">
              Kết quả soi được giữ bí mật tuyệt đối và chỉ gửi riêng cho Tiên Tri:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {livingPlayers
                .filter((p) => p.id !== myPlayer?.id)
                .map((p) => {
                  const isSelected = selectedTargetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSeerInspect(p.id)}
                      disabled={hasActed || isSubmitting}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${isSelected
                        ? 'bg-purple-950 border-purple-500 text-white ring-2 ring-purple-500'
                        : 'bg-black/40 border-slate-800 hover:border-purple-600/60 text-slate-300'
                        }`}
                    >
                      <span className="truncate w-full text-center">{p.name}</span>
                      <span className="text-[10px] text-purple-400">Soi bài</span>
                    </button>
                  );
                })}
            </div>

            {seerResult && (
              <div className="p-3.5 rounded-xl bg-purple-950/80 border border-purple-500 text-xs text-purple-200 font-bold space-y-1 animate-in zoom-in-95">
                <span className="text-purple-400 block font-mono uppercase text-[10px]">
                  KẾT QUẢ QUẢ CẦU TIÊN TRI:
                </span>
                <p className="text-sm text-white">{seerResult}</p>
              </div>
            )}
          </div>
        )}

        {/* Case C: Bodyguard Night Action */}
        {phase === 'NIGHT_GUARD' && myRole === 'BODYGUARD' && isAlive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Chọn một người để giơ khiên bảo vệ
            </div>
            <p className="text-xs text-slate-300">
              Không thể bảo vệ cùng một người trong 2 đêm liên tiếp:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {livingPlayers.map((p) => {
                const isSelected = selectedTargetId === p.id;
                const isLastProtected = p.id === myPlayer?.lastProtectedTargetId;
                const isSelf = p.id === myPlayer?.id;
                const disabled =
                  hasActed ||
                  isLastProtected ||
                  (isSelf && !room.settings.allowSelfGuard);

                return (
                  <button
                    key={p.id}
                    onClick={() => handleGuardProtect(p.id)}
                    disabled={disabled || isSubmitting}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${isSelected
                      ? 'bg-blue-950 border-blue-500 text-white ring-2 ring-blue-500'
                      : disabled
                        ? 'opacity-30 bg-black/20 border-slate-800'
                        : 'bg-black/40 border-slate-800 hover:border-blue-600/60 text-slate-300'
                      }`}
                  >
                    <span className="truncate w-full text-center">{p.name}</span>
                    <span className="text-[10px] text-blue-400">
                      {isLastProtected ? 'Đã bảo vệ đêm trước' : isSelf ? 'Bản thân' : 'Bảo vệ'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Case D: Witch Night Action */}
        {phase === 'NIGHT_WITCH' && myRole === 'WITCH' && isAlive && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Quyền năng Phù Thủy
            </div>

            {/* Victim info */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 text-xs">
              {room.activeNightTarget ? (
                <p className="text-slate-200">
                  ⚠️ Đêm nay,{' '}
                  <strong className="text-red-400">
                    {room.players.find((p) => p.id === room.activeNightTarget)?.name}
                  </strong>{' '}
                  đã bị Ma Sói chọn làm nạn nhân!
                </p>
              ) : (
                <p className="text-slate-400 italic">Đêm nay Ma Sói không tấn công ai.</p>
              )}
            </div>

            {/* Potions Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleWitchHeal}
                disabled={!myPlayer?.witchPotions?.heal || !room.activeNightTarget || hasActed}
                className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600 disabled:opacity-30 text-emerald-200 text-xs font-bold flex flex-col items-center gap-1 transition"
              >
                <Heart className="w-4 h-4 text-emerald-400" />
                <span>Bình Thuốc Cứu</span>
                <span className="text-[10px] text-slate-400">
                  {myPlayer?.witchPotions?.heal ? 'Còn 1 lần' : 'Đã hết'}
                </span>
              </button>

              <button
                onClick={handleWitchSkip}
                disabled={hasActed}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 transition"
              >
                <Check className="w-4 h-4 text-slate-400" />
                <span>Bỏ qua lượt</span>
                <span className="text-[10px] text-slate-400">Không dùng thuốc</span>
              </button>

              <div className="relative">
                <span className="text-[10px] text-red-400 font-bold block mb-1 text-center">
                  Bình Thuốc Độc
                </span>
                <select
                  disabled={!myPlayer?.witchPotions?.poison || hasActed}
                  onChange={(e) => {
                    if (e.target.value) handleWitchPoison(e.target.value);
                  }}
                  defaultValue=""
                  className="w-full p-2 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 font-semibold focus:outline-none"
                >
                  <option value="" disabled>
                    {myPlayer?.witchPotions?.poison ? 'Chọn người để đầu độc' : 'Đã hết thuốc độc'}
                  </option>
                  {livingPlayers
                    .filter((p) => p.id !== myPlayer?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Case E: Spectator / Inactive at night */}
        {isNight && !isMyTurnAtNight && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
            <Moon className="w-8 h-8 text-indigo-400/80 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-300 font-cinzel">
              MÀN ĐÊM HUYỀN BÍ
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Ngôi làng đang chìm vào giấc ngủ sâu. Hãy giữ im lặng và lắng nghe tiếng gió rít qua rặng thông...
            </p>
          </div>
        )}

        {/* Case F: Day Discussion */}
        {phase === 'DAY_DISCUSSION' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sun className="w-4 h-4" /> Thảo luận tự do ban ngày
            </div>
            <p className="text-xs text-slate-300">
              Hãy trao đổi suy luận qua khung chat bên dưới, bảo vệ bản thân và tìm ra kẻ nói dối trước khi giờ bỏ phiếu bắt đầu!
            </p>
          </div>
        )}

        {/* Case G: Day Voting */}
        {phase === 'DAY_VOTING' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
              <Crosshair className="w-4 h-4" /> Bỏ phiếu treo cổ kẻ đáng ngờ
            </div>
            <p className="text-xs text-slate-300">
              Chạm vào một người còn sống để bỏ phiếu đưa lên đoạn đầu đài:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {livingPlayers.map((p) => {
                const isSelected = selectedTargetId === p.id;
                const isMe = p.id === myPlayer?.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleVote(p.id)}
                    disabled={!isAlive || isSubmitting}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${isSelected
                      ? 'bg-red-950 border-red-500 text-white ring-2 ring-red-500'
                      : 'bg-black/40 border-slate-800 hover:border-red-600/60 text-slate-300'
                      }`}
                  >
                    <span className="truncate w-full text-center">{p.name}</span>
                    <span className="text-[10px] text-slate-500">{isMe ? '(Bản thân)' : 'Bỏ phiếu'}</span>
                  </button>
                );
              })}

              {room.settings.allowBlankVote && (
                <button
                  onClick={() => handleVote(null)}
                  disabled={!isAlive || isSubmitting}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition ${selectedTargetId === null && hasActed
                    ? 'bg-slate-800 border-amber-500 text-amber-300 ring-2 ring-amber-500'
                    : 'bg-black/40 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                >
                  <span>Phiếu trắng</span>
                  <span className="text-[10px] text-slate-500">Không treo ai</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Notice feedback */}
        {actionNotice && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* 3. Players Roster (Living & Dead) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" /> Tình trạng người chơi
          </span>
          <span className="font-mono text-emerald-400">
            Còn sống: {livingPlayers.length} / {room.players.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {room.players.map((p) => {
            const isMe = p.id === myPlayer?.id;
            const isDead = !p.isAlive;
            const isWolfAlly = myRole === 'WEREWOLF' && p.role === 'WEREWOLF';

            return (
              <div
                key={p.id}
                className={`p-2 rounded-xl border flex items-center gap-2 transition ${isDead
                  ? 'opacity-40 bg-slate-950/60 border-slate-900 grayscale'
                  : isMe
                    ? 'bg-amber-950/40 border-amber-500/50'
                    : 'bg-black/30 border-slate-800'
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${isDead
                    ? 'bg-red-950/80 border-red-800 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-amber-400'
                    }`}
                >
                  {isDead ? <Skull className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {p.name}
                    </span>
                    {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    {isDead ? (
                      <span className="text-red-400">Đã chết</span>
                    ) : (
                      <span className="text-emerald-400">Còn sống</span>
                    )}
                    {isWolfAlly && <span className="text-red-400 font-bold">[Sói]</span>}
                    {p.role && (isDead || room.phase === 'GAME_OVER') && (
                      <span className="text-amber-400 font-medium">({ROLE_DETAILS[p.role].name})</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Chat Box */}
      <ChatBox
        roomId={room.id}
        myPlayer={myPlayer}
        phase={phase}
        messages={messages}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};
