import React, { useState } from 'react';
import { type RoomSettings, type Role } from '../types/werewolf';
import { getPresetRolesForCount, DEFAULT_ROOM_SETTINGS, ROLE_DETAILS } from '../services/werewolfLogic';
import { ArrowLeft, Users, Clock, ShieldCheck, Sparkles, Moon, Eye, Shield, AlertCircle } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface CreateRoomScreenProps {
  playerName: string;
  onBack: () => void;
  onSubmitCreate: (settings: RoomSettings, roleDistribution: Record<Role, number>) => void;
  isLoading?: boolean;
}

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  onBack,
  onSubmitCreate,
  isLoading = false,
}) => {
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [settings, setSettings] = useState<RoomSettings>({
    ...DEFAULT_ROOM_SETTINGS,
    maxPlayers: 8,
  });

  const [roles, setRoles] = useState<Record<Role, number>>(getPresetRolesForCount(8));

  // Auto preset update when slider changes
  const handlePlayerCountChange = (count: number) => {
    setMaxPlayers(count);
    setSettings((prev) => ({ ...prev, maxPlayers: count }));
    setRoles(getPresetRolesForCount(count));
  };

  const handleRoleCountChange = (role: Role, delta: number) => {
    sounds.playClick();
    setRoles((prev) => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [role]: next };
    });
  };

  const totalRoles = (Object.keys(roles) as Role[]).reduce((sum, r) => sum + (roles[r] || 0), 0);
  const wolfCount = roles.WEREWOLF || 0;

  const isValidCount = totalRoles === maxPlayers;
  const isValidWolfRatio = wolfCount > 0 && wolfCount < totalRoles / 2;
  const canCreate = isValidCount && isValidWolfRatio;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    sounds.playClick();
    onSubmitCreate(settings, roles);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 text-slate-200">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-lg font-bold font-cinzel text-amber-300">THIẾT LẬP PHÒNG CHƠI</h2>
        <div className="w-16"></div>
      </div>

      <form onSubmit={handleCreateSubmit} className="space-y-6">
        {/* 1. Max Players */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> Số lượng người chơi
            </span>
            <span className="text-xl font-black font-cinzel text-amber-300 px-3 py-1 bg-amber-500/10 rounded-xl border border-amber-500/30">
              {maxPlayers} Người
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={16}
            value={maxPlayers}
            onChange={(e) => handlePlayerCountChange(parseInt(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>5 người (Tối thiểu)</span>
            <span>8 người (Khuyên dùng)</span>
            <span>16 người (Tối đa)</span>
          </div>
        </div>

        {/* 2. Role Configuration */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Cấu hình bộ vai trò
              </h3>
              <p className="text-xs text-slate-400">
                Tổng vai trò:{' '}
                <strong className={isValidCount ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalRoles} / {maxPlayers}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRoles(getPresetRolesForCount(maxPlayers))}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
            >
              Preset tự động
            </button>
          </div>

          {/* Role List Steppers */}
          <div className="space-y-2.5">
            {(Object.keys(ROLE_DETAILS) as Role[]).map((r) => {
              const info = ROLE_DETAILS[r];
              const count = roles[r] || 0;

              return (
                <div
                  key={r}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    {r === 'WEREWOLF' && <Moon className="w-5 h-5 text-red-400" />}
                    {r === 'SEER' && <Eye className="w-5 h-5 text-purple-400" />}
                    {r === 'BODYGUARD' && <Shield className="w-5 h-5 text-blue-400" />}
                    {r === 'WITCH' && <Sparkles className="w-5 h-5 text-emerald-400" />}
                    {r === 'VILLAGER' && <Users className="w-5 h-5 text-amber-400" />}
                    <div>
                      <span className={`text-xs font-bold font-cinzel ${info.color}`}>
                        {info.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{info.teamName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleCountChange(r, -1)}
                      disabled={count <= 0}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-sm text-slate-100 font-mono">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRoleCountChange(r, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Notice */}
          {!isValidCount && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/60 text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Cần điều chỉnh vai trò sao cho tổng số vai trò bằng {maxPlayers} người chơi (hiện có {totalRoles}).
              </span>
            </div>
          )}

          {!isValidWolfRatio && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-600/60 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                Số lượng Ma Sói ({wolfCount}) phải lớn hơn 0 và ít hơn 50% tổng số người chơi.
              </span>
            </div>
          )}
        </div>

        {/* 3. Timers & Rules Customization */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" /> Thời gian & Luật chơi
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Thảo luận ngày</span>
              <select
                value={settings.dayDiscussionDuration}
                onChange={(e) =>
                  setSettings({ ...settings, dayDiscussionDuration: parseInt(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs text-amber-300 font-bold focus:outline-none"
              >
                <option value={45}>45 giây</option>
                <option value={60}>60 giây</option>
                <option value={75}>75 giây</option>
                <option value={90}>90 giây</option>
                <option value={120}>120 giây</option>
              </select>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Thời gian bỏ phiếu</span>
              <select
                value={settings.votingDuration}
                onChange={(e) =>
                  setSettings({ ...settings, votingDuration: parseInt(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs text-amber-300 font-bold focus:outline-none"
              >
                <option value={30}>30 giây</option>
                <option value={40}>40 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Hành động đêm</span>
              <select
                value={settings.nightActionDuration}
                onChange={(e) =>
                  setSettings({ ...settings, nightActionDuration: parseInt(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs text-amber-300 font-bold focus:outline-none"
              >
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
                <option value={45}>45 giây</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Cho phép bỏ phiếu trắng vào ban ngày</span>
              <input
                type="checkbox"
                checked={settings.allowBlankVote}
                onChange={(e) => setSettings({ ...settings, allowBlankVote: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Tiết lộ vai trò khi người chơi bị loại</span>
              <input
                type="checkbox"
                checked={settings.revealRoleOnDeath}
                onChange={(e) => setSettings({ ...settings, revealRoleOnDeath: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Cho phép Bảo Vệ tự bảo vệ bản thân</span>
              <input
                type="checkbox"
                checked={settings.allowSelfGuard}
                onChange={(e) => setSettings({ ...settings, allowSelfGuard: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canCreate || isLoading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black font-cinzel text-base shadow-[0_0_25px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 transition transform active:scale-95"
        >
          {isLoading ? (
            'ĐANG KHỞI TẠO PHÒNG...'
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" /> TẠO PHÒNG NGAY
            </>
          )}
        </button>
      </form>
    </div>
  );
};
