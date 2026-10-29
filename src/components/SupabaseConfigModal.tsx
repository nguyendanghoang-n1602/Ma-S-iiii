import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Copy, Check, Server, Globe, ExternalLink } from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
} from '../services/supabaseClient';
import { gameService, type BackendMode } from '../services/gameService';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [mode, setMode] = useState<BackendMode>('LOCAL');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setMode(gameService.getMode());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseCredentials(url, key);
    try {
      gameService.setMode(mode);
    } catch {
      // Fallback to local if supabase not configured
    }
    onConfigSaved();
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, key);
    setIsTesting(false);
    setTestResult(result);
  };

  const sampleSql = `-- SCHEMA DATABASE SUPABASE CHO LÀNG SÓI (WEREWOLF ONLINE)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    host_id TEXT NOT NULL,
    phase VARCHAR(30) NOT NULL DEFAULT 'LOBBY',
    day_count INT NOT NULL DEFAULT 0,
    night_count INT NOT NULL DEFAULT 0,
    settings JSONB NOT NULL DEFAULT '{"maxPlayers": 8, "dayDiscussionDuration": 90, "votingDuration": 45, "nightActionDuration": 30, "allowBlankVote": true, "revealRoleOnDeath": true, "allowSelfGuard": false}'::jsonb,
    role_distribution JSONB NOT NULL DEFAULT '{"WEREWOLF": 2, "SEER": 1, "BODYGUARD": 1, "WITCH": 1, "VILLAGER": 3}'::jsonb,
    phase_ends_at TIMESTAMPTZ,
    active_night_target TEXT,
    witch_saved_target BOOLEAN DEFAULT false,
    witch_poisoned_target_id TEXT,
    last_dead_player_ids JSONB DEFAULT '[]'::jsonb,
    winner_team VARCHAR(20),
    win_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.players (
    id TEXT NOT NULL,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    avatar_seed VARCHAR(50) NOT NULL DEFAULT 'wolf1',
    is_host BOOLEAN NOT NULL DEFAULT false,
    is_alive BOOLEAN NOT NULL DEFAULT true,
    is_connected BOOLEAN NOT NULL DEFAULT true,
    seat_number INT NOT NULL DEFAULT 1,
    role VARCHAR(30),
    witch_potions JSONB NOT NULL DEFAULT '{"heal": true, "poison": true}'::jsonb,
    last_protected_target_id TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id, room_id)
);

CREATE TABLE IF NOT EXISTS public.game_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    phase VARCHAR(30) NOT NULL,
    actor_id TEXT NOT NULL,
    target_id TEXT,
    action_type VARCHAR(30) NOT NULL,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.game_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    sender_role VARCHAR(30),
    channel VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_actions;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public insert rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Public delete players" ON public.players FOR DELETE USING (true);
CREATE POLICY "Public read messages" ON public.game_messages FOR SELECT USING (true);
CREATE POLICY "Public insert messages" ON public.game_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read actions" ON public.game_actions FOR SELECT USING (true);
CREATE POLICY "Public insert actions" ON public.game_actions FOR INSERT WITH CHECK (true);
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sampleSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#121826] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c101b]">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold font-cinzel text-amber-300">CẤU HÌNH BACKEND & KẾT NỐI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Chế độ kết nối máy chủ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('SUPABASE')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${mode === 'SUPABASE'
                    ? 'border-indigo-500 bg-indigo-950/60 text-white ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Globe className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-xs">Supabase Cloud Realtime</span>
                <span className="text-[11px] text-slate-400">Chơi online qua Internet với bạn bè</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('LOCAL')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${mode === 'LOCAL'
                    ? 'border-amber-500 bg-amber-950/60 text-white ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Server className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-xs">Sandbox Multi-Tab / Bot</span>
                <span className="text-[11px] text-slate-400">Chơi thử ngay không cần cấu hình</span>
              </button>
            </div>
          </div>

          {/* Supabase URL and Key inputs */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">VITE_SUPABASE_URL</label>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono text-xs placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                VITE_SUPABASE_ANON_KEY
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono text-xs placeholder:text-slate-600"
              />
            </div>

            {/* Test connection action */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !url || !key}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </button>

              <button
                type="button"
                onClick={() => setShowSqlViewer(!showSqlViewer)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                {showSqlViewer ? 'Ẩn mã SQL' : 'Xem mã SQL Schema'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${testResult.success
                    ? 'bg-emerald-950/60 border border-emerald-600 text-emerald-300'
                    : 'bg-red-950/60 border border-red-600 text-red-300'
                  }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* SQL Schema Viewer */}
          {showSqlViewer && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">PostgreSQL Schema (Supabase SQL Editor)</span>
                <button
                  onClick={copySqlToClipboard}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Đã sao chép!' : 'Sao chép SQL'}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 p-3 bg-black/40 rounded-lg overflow-x-auto max-h-48">
                {sampleSql}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0c101b] flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {mode === 'SUPABASE' ? 'Chế độ: Supabase Cloud' : 'Chế độ: Sandbox Offline'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-cinzel text-xs transition"
            >
              LƯU & ÁP DỤNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
