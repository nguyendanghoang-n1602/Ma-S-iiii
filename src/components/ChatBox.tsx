import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Player, GamePhase } from '../types/werewolf';
import { Send, Moon, MessageSquare, ShieldAlert } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface ChatBoxProps {
  roomId: string;
  myPlayer?: Player;
  phase: GamePhase;
  messages: ChatMessage[];
  onSendMessage: (content: string, channel: ChatMessage['channel']) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  myPlayer,
  phase,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChatMessage['channel']>('PUBLIC');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isWolf = myPlayer?.role === 'WEREWOLF';
  const isNight = phase.startsWith('NIGHT_');
  const isAlive = myPlayer?.isAlive;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Adjust default channel based on phase and role
  useEffect(() => {
    if (isNight && isWolf) {
      setActiveChannel('WEREWOLVES');
    } else {
      setActiveChannel('PUBLIC');
    }
  }, [isNight, isWolf]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (!isAlive && activeChannel !== 'SYSTEM') {
      // Dead players cannot chat
      return;
    }

    onSendMessage(inputText.trim(), activeChannel);
    setInputText('');
    sounds.playClick();
  };

  // Filter messages based on player permissions:
  // - Werewolf messages: only visible to werewolves
  // - Seer private messages: only visible to Seer
  // - System & Public: visible to all
  const visibleMessages = messages.filter((msg) => {
    if (msg.channel === 'WEREWOLVES') {
      return isWolf;
    }
    if (msg.channel === 'SEER_PRIVATE') {
      return myPlayer?.role === 'SEER';
    }
    return true;
  });

  return (
    <div className="w-full flex flex-col h-64 md:h-80 bg-[#0f1422]/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Chat header tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveChannel('PUBLIC')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${activeChannel === 'PUBLIC'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Làng ({visibleMessages.filter((m) => m.channel === 'PUBLIC').length})
          </button>

          {isWolf && (
            <button
              type="button"
              onClick={() => setActiveChannel('WEREWOLVES')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${activeChannel === 'WEREWOLVES'
                ? 'bg-red-950/60 text-red-300 border border-red-600'
                : 'text-slate-400 hover:text-red-300'
                }`}
            >
              <Moon className="w-3.5 h-3.5 text-red-400" /> Bầy Sói
            </button>
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {activeChannel === 'WEREWOLVES' ? 'Kênh mật đàn sói' : 'Kênh chung'}
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic">
            Chưa có tin nhắn nào trong phòng...
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMine = msg.senderId === myPlayer?.id;
            const isSystem = msg.channel === 'SYSTEM';
            const isSeerVision = msg.channel === 'SEER_PRIVATE';
            const isWolfChannel = msg.channel === 'WEREWOLVES';

            if (isSystem) {
              return (
                <div key={msg.id} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-center font-medium my-1">
                  📢 {msg.content}
                </div>
              );
            }

            if (isSeerVision) {
              return (
                <div key={msg.id} className="p-2.5 rounded-lg bg-purple-950/50 border border-purple-600 text-purple-200 text-left my-1 shadow">
                  🔮 <strong className="text-purple-300">Soi bài:</strong> {msg.content}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                  <span className="font-semibold text-slate-300">{msg.senderName}</span>
                  {isWolfChannel && <span className="text-red-400 text-[9px]">[Sói]</span>}
                </div>
                <div
                  className={`max-w-[85%] px-3 py-1.5 rounded-xl break-words ${isWolfChannel
                    ? isMine
                      ? 'bg-red-800 text-red-50 rounded-br-none border border-red-600'
                      : 'bg-red-950/80 text-red-200 rounded-bl-none border border-red-800'
                    : isMine
                      ? 'bg-amber-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-2 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
        {!isAlive ? (
          <div className="flex-1 py-1.5 px-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-500 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Bạn đã bị loại và không thể gửi tin nhắn.
          </div>
        ) : (
          <>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeChannel === 'WEREWOLVES'
                  ? 'Thảo luận bí mật với đàn sói...'
                  : 'Nhập tin nhắn thảo luận cùng dân làng...'
              }
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        )}
      </form>
    </div>
  );
};
