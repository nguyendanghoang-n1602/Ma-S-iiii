# 🐺 LÀNG SÓI — WEREWOLF ONLINE

**LÀNG SÓI (Werewolf Online)** là tựa game Ma Sói trực tuyến nhiều người chơi hoàn chỉnh, được xây dựng theo phong cách mobile-first hiện đại, giao diện huyền bí mang đậm chất làng quê đêm trăng rằm, hỗ trợ kết nối realtime và PWA trên Android, iPhone và máy tính.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Chơi Online Realtime qua Mã Phòng**:
   - Mỗi phòng chơi có mã duy nhất 6 chữ cái (VD: `SOIVIP`).
   - Chia sẻ liên kết phòng chỉ với 1 chạm (hỗ trợ Web Share API).
   - Danh tính người chơi (Session ID) được lưu trữ bền vững trong `localStorage`, không mất ghế khi tải lại trang hay ngắt kết nối tạm thời.
2. **Hệ Thống Vai Trò Chuẩn**:
   - **Ma Sói (Werewolf)**: Nhìn thấy nhau, chat bí mật qua kênh riêng của đàn sói, cùng chọn nạn nhân mỗi đêm.
   - **Tiên Tri (Seer)**: Soi sáng tâm can một người mỗi đêm, nhận kết quả bảo mật riêng ("Phe Sói" hoặc "Phe Dân Làng").
   - **Bảo Vệ (Bodyguard)**: Giơ khiên che chở 1 người mỗi đêm (không thể bảo vệ cùng 1 người 2 đêm liên tiếp).
   - **Phù Thủy (Witch)**: Sở hữu 1 bình thuốc cứu và 1 bình thuốc độc dùng trong cả ván. Biết ai bị sói cắn để đưa ra quyết định.
   - **Dân Làng (Villager)**: Thảo luận ban ngày và bỏ phiếu treo cổ kẻ đáng ngờ.
3. **Tiến Trình Game Tự Động & Chặt Chẽ**:
   - Phân vai ngẫu nhiên bí mật.
   - Luân phiên Đêm (`NIGHT_WOLVES` ➔ `NIGHT_SEER` ➔ `NIGHT_GUARD` ➔ `NIGHT_WITCH` ➔ `NIGHT_RESOLUTION`).
   - Ban ngày: Công bố người thiệt mạng ➔ Thảo luận tự do có đồng hồ đếm ngược ➔ Bỏ phiếu treo cổ ➔ Hành quyết.
   - Kiểm tra điều kiện thắng tự động cho cả 2 phe.
4. **Âm Thanh Sống Động (Web Audio API)**:
   - Tự tổng hợp âm thanh không cần tải file mp3 bên ngoài: Tiếng sói hú, chuông làng buổi sáng, cồng hành quyết, khiên bảo vệ, bình thuốc ma thuật, quả cầu tiên tri, tiếng tích tắc đếm ngược.
   - Hỗ trợ bật/tắt âm thanh và lưu trạng thái.
5. **Chế Độ Linh Hoạt (Dual-Mode)**:
   - **Chế độ Supabase Cloud**: Kết nối CSDL PostgreSQL & Realtime Channel để chơi qua Internet cùng bạn bè.
   - **Chế độ Sandbox / Multi-tab & Bot**: Chơi thử nghiệm trực tiếp ngay lập tức trên máy hoặc nhiều tab trình duyệt, hỗ trợ thêm Bot AI kiểm thử 1 chạm.
6. **Chuẩn PWA (Progressive Web App)**:
   - Thêm vào màn hình chính trên iOS (Safari) và Android (Chrome).
   - Trải nghiệm toàn màn hình mượt mà như app gốc.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

### 1. Cài đặt và chạy cục bộ
```bash
# Cài đặt thư viện
npm install

# Khởi chạy dev server
npm run dev

# Mở trình duyệt tại: http://localhost:5173
```

### 2. Thiết lập Supabase Database (Chơi qua Internet)
1. Đăng ký/đăng nhập tài khoản tại [Supabase](https://supabase.com).
2. Tạo một Project mới.
3. Vào mục **SQL Editor** trên Dashboard của Supabase, mở tệp [`src/supabase/schema.sql`](file:///d:/Ma%20Soi/src/supabase/schema.sql) và nhấn **Run** để khởi tạo các bảng và chính sách bảo mật (RLS).
4. Vào mục **Project Settings ➔ API**, lấy 2 thông tin:
   - `Project URL`
   - `anon public key`
5. Nhập vào tệp `.env` hoặc bấm trực tiếp nút **Kết nối Backend (Database)** ở góc trên cùng của giao diện game để lưu.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4.
- **Biểu tượng**: Lucide React.
- **Backend & Realtime**: Supabase (PostgreSQL, Realtime Channel, RLS).
- **Âm thanh**: Web Audio API Procedural Synthesizer.
- **Hiệu ứng**: Canvas Stars & Fog, Canvas Confetti.
