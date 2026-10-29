import React, { useState } from 'react';
import { X, Moon, Eye, Shield, Sparkles, Users, BookOpen, Trophy, HelpCircle } from 'lucide-react';
import { ROLE_DETAILS } from '../services/werewolfLogic';
import type { Role } from '../types/werewolf';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ROLES' | 'FLOW' | 'WIN' | 'FAQ'>('ROLES');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#121826] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c101b]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-cinzel text-amber-300">CẨM NANG LUẬT CHƠI LÀNG SÓI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-medium whitespace-nowrap transition border-b-2 ${activeTab === 'ROLES'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-4 h-4" /> Các Vai Trò
          </button>
          <button
            onClick={() => setActiveTab('FLOW')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-medium whitespace-nowrap transition border-b-2 ${activeTab === 'FLOW'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Moon className="w-4 h-4" /> Tiến Trình Đêm & Ngày
          </button>
          <button
            onClick={() => setActiveTab('WIN')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-medium whitespace-nowrap transition border-b-2 ${activeTab === 'WIN'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Trophy className="w-4 h-4" /> Điều Kiện Thắng
          </button>
          <button
            onClick={() => setActiveTab('FAQ')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-medium whitespace-nowrap transition border-b-2 ${activeTab === 'FAQ'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <HelpCircle className="w-4 h-4" /> Câu Hỏi Thường Gặp
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4">
          {activeTab === 'ROLES' && (
            <div className="space-y-4">
              {(Object.keys(ROLE_DETAILS) as Role[]).map((roleKey) => {
                const info = ROLE_DETAILS[roleKey];
                return (
                  <div
                    key={roleKey}
                    className={`p-4 rounded-xl border ${info.borderColor} ${info.bgColor} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {roleKey === 'WEREWOLF' && <Moon className="w-5 h-5 text-red-400" />}
                        {roleKey === 'SEER' && <Eye className="w-5 h-5 text-purple-400" />}
                        {roleKey === 'BODYGUARD' && <Shield className="w-5 h-5 text-blue-400" />}
                        {roleKey === 'WITCH' && <Sparkles className="w-5 h-5 text-emerald-400" />}
                        {roleKey === 'VILLAGER' && <Users className="w-5 h-5 text-amber-400" />}
                        <h3 className={`font-bold font-cinzel text-base ${info.color}`}>{info.name}</h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-black/40 border border-slate-700 font-semibold text-slate-300">
                        {info.teamName}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{info.description}</p>
                    <div className="text-xs bg-black/30 p-2.5 rounded-lg border border-slate-800/80 text-amber-200/90">
                      <span className="font-semibold text-amber-400">Kỹ năng đặc biệt: </span>
                      {info.ability}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'FLOW' && (
            <div className="space-y-4 text-sm leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" /> 1. Giai đoạn Ban Đêm
                </h4>
                <p className="text-slate-300">Cả làng nhắm mắt ngủ. Từng vai trò được gọi dậy theo thứ tự:</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                  <li><strong className="text-red-400">Ma Sói:</strong> Thức dậy cùng thảo luận qua kênh chat bí mật và chọn 1 mục tiêu tấn công.</li>
                  <li><strong className="text-purple-400">Tiên Tri:</strong> Chọn 1 người còn sống để soi bài (kết quả hiển thị riêng tư).</li>
                  <li><strong className="text-blue-400">Bảo Vệ:</strong> Chọn 1 người để bảo vệ khỏi nanh vuốt sói (không được chọn cùng 1 người 2 đêm liền).</li>
                  <li><strong className="text-emerald-400">Phù Thủy:</strong> Nhìn thấy người bị sói cắn (nếu còn bình cứu). Quyết định có cứu hoặc có dùng bình thuốc độc để hạ sát ai không.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> 2. Bình Minh & Ban Ngày
                </h4>
                <p className="text-slate-300">
                  Quản trò công bố người thiệt mạng trong đêm (hoặc không ai chết nếu được bảo vệ hay phù thủy cứu).
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong className="text-amber-300">Thảo luận tự do:</strong> Người sống trao đổi ý kiến, lập luận, truy tìm kẻ nói dối.</li>
                  <li><strong className="text-amber-300">Bỏ phiếu:</strong> Tất cả người còn sống bỏ 1 phiếu treo cổ kẻ đáng nghi hoặc bỏ phiếu trắng.</li>
                  <li><strong className="text-amber-300">Hành quyết:</strong> Người có số phiếu cao nhất bị loại khỏi trò chơi. Nếu hòa phiếu hoặc phiếu trắng chiếm đa số, không ai bị treo cổ.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'WIN' && (
            <div className="space-y-4 text-sm leading-relaxed">
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-700/50 space-y-2">
                <h4 className="font-bold text-red-400 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-red-400" /> Phe Ma Sói Chiến Thắng Khi:
                </h4>
                <p className="text-slate-300">
                  Số lượng Ma Sói còn sống bằng hoặc nhiều hơn số lượng Dân Làng còn sống (Ví dụ: 2 Sói vs 2 Dân). Khi đó, phe Sói làm chủ hoàn toàn ngôi làng.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" /> Phe Dân Làng Chiến Thắng Khi:
                </h4>
                <p className="text-slate-300">
                  Toàn bộ Ma Sói trong làng đã bị tiêu diệt (bằng treo cổ ban ngày hoặc độc dược của Phù Thủy ban đêm). Ngôi làng trở lại yên bình vĩnh viễn!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'FAQ' && (
            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="font-bold text-amber-400 mb-1">Khi tải lại trang tôi có bị mất vai trò không?</h5>
                <p className="text-slate-300">
                  Không! Hệ thống lưu trữ danh tính định danh an toàn (Session ID). Bạn chỉ cần mở lại trang hoặc nhập mã phòng là tự động kết nối lại đúng vị trí ngồi và vai trò bí mật của mình.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="font-bold text-amber-400 mb-1">Người chết có được chat hoặc bỏ phiếu không?</h5>
                <p className="text-slate-300">
                  Theo luật, người đã chết không thể bỏ phiếu hay thực hiện các kỹ năng ban đêm. Họ có thể quan sát diễn biến kịch tính cho tới khi ván kết thúc.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h5 className="font-bold text-amber-400 mb-1">Có thể chơi trên cả iPhone và Android không?</h5>
                <p className="text-slate-300">
                  Có! Ứng dụng hỗ trợ PWA chuẩn Web. Bạn có thể bấm "Thêm vào MH chính" trên Safari (iPhone) hoặc Chrome (Android) để mở toàn màn hình mượt mà như app tải từ App Store.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0c101b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition font-cinzel text-sm"
          >
            ĐÃ HIỂU LUẬT CHƠI
          </button>
        </div>
      </div>
    </div>
  );
};
