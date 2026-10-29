import React from 'react';
import { X, Smartphone, Share2, PlusSquare, MoreVertical, Download, Check } from 'lucide-react';

interface InstallPWAModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export const InstallPWAModal: React.FC<InstallPWAModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#121826] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c101b]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-cinzel text-amber-300">CÀI ĐẶT ỨNG DỤNG LÀNG SÓI</h2>
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
          {/* Quick 1-click install button if Chrome supports */}
          {deferredPrompt && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-center space-y-3">
              <p className="text-amber-200 font-semibold">
                Trình duyệt của bạn hỗ trợ cài đặt ứng dụng trực tiếp chỉ với 1 chạm!
              </p>
              <button
                onClick={handleNativeInstall}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-cinzel text-sm shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> CÀI ĐẶT NGAY BÂY GIỜ
              </button>
            </div>
          )}

          {/* Android instructions */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3>Dành cho điện thoại Android (Google Chrome)</h3>
            </div>
            <ol className="space-y-2 text-slate-300 text-xs pl-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400">1.</span>
                <span>
                  Bấm vào biểu tượng <strong>Menu ba chấm</strong> (<MoreVertical className="w-3.5 h-3.5 inline text-slate-400" />) ở góc trên bên phải trình duyệt.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400">2.</span>
                <span>
                  Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong> (Add to Home screen).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400">3.</span>
                <span>Xác nhận cài đặt. Biểu tượng Làng Sói sẽ xuất hiện trên màn hình điện thoại như ứng dụng thông thường.</span>
              </li>
            </ol>
          </div>

          {/* iPhone instructions */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <h3>Dành cho iPhone / iPad (Trình duyệt Safari)</h3>
            </div>
            <ol className="space-y-2 text-slate-300 text-xs pl-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400">1.</span>
                <span>
                  Mở game bằng trình duyệt <strong>Safari</strong> và nhấn vào nút <strong>Chia sẻ</strong> (<Share2 className="w-3.5 h-3.5 inline text-sky-400" />) ở thanh công cụ dưới đáy màn hình.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400">2.</span>
                <span>
                  Cuộn xuống và chọn mục <strong>"Thêm vào MH chính"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-sky-400" />).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-400">3.</span>
                <span>
                  Nhấn <strong>"Thêm"</strong> ở góc trên bên phải. Game sẽ mở toàn màn hình không có thanh URL, mang lại trải nghiệm tốt nhất!
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0c101b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" /> Đã rõ
          </button>
        </div>
      </div>
    </div>
  );
};
