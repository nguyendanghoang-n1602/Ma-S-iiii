import React, { useState } from 'react';
import { ArrowLeft, LogIn, Clipboard, AlertCircle } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface JoinRoomScreenProps {
  onBack: () => void;
  onSubmitJoin: (roomCode: string) => Promise<void>;
  isLoading?: boolean;
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  onBack,
  onSubmitJoin,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.trim().toUpperCase().substring(0, 6));
        sounds.playClick();
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setErrorMsg('Mã phòng phải có từ 4 đến 6 ký tự.');
      return;
    }

    try {
      sounds.playClick();
      await onSubmitJoin(cleanCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center min-h-[calc(100vh-80px)] text-slate-200">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-lg font-bold font-cinzel text-amber-300">THAM GIA PHÒNG</h2>
        <div className="w-16"></div>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold font-cinzel text-amber-400">NHẬP MÃ PHÒNG CHƠI</h3>
          <p className="text-xs text-slate-400">
            Hỏi bạn bè hoặc chủ phòng mã gồm 6 chữ cái để cùng tham gia ván đấu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Mã phòng (Code)
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: SOIVIP"
                autoFocus
                className="w-full text-center tracking-[0.3em] font-mono text-2xl font-black py-3.5 px-4 rounded-xl bg-black/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-amber-300 uppercase placeholder:text-slate-700"
              />
              <button
                type="button"
                onClick={handlePaste}
                title="Dán từ khay nhớ tạm"
                className="absolute right-2.5 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-600/70 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.trim().length < 4}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black font-cinzel text-base shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            {isLoading ? (
              'ĐANG KẾT NỐI VÀO PHÒNG...'
            ) : (
              <>
                <LogIn className="w-5 h-5" /> VÀO PHÒNG CHƠI
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
