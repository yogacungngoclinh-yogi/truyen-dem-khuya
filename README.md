# Truyện Đêm Khuya

App web cho bé nghe truyện trước giờ ngủ: 80 truyện tranh đạo đức song ngữ Anh – Việt (89 trang), có giọng đọc, chữ sáng dần theo lời đọc. Thương hiệu Linora Yoga. Làm ngày 2026-11-07.

## Dùng

- Mở qua web (http/https). Mở thẳng file `index.html` thì không có tiếng và không chạy khi mất mạng.
- Chạy thử trên máy: `python -m http.server 8771 --directory 4-dung/app` → mở http://localhost:8771
- Tủ truyện: 4 chủ đề (Trung thực · Khiêm tốn & Nỗ lực · Lòng tốt · Biết ơn) + lọc ♥ Bé thích. "Truyện tối nay" gợi ý ngẫu nhiên 1 truyện chưa nghe.
- Đọc: bấm ▶ → app phóng to từng khung, đọc lời, tô sáng từng chữ, tự sang khung kế. Hết truyện → màn "Chúc bé ngủ ngon", **không tự chuyển truyện**; bấm "Truyện tiếp ›" để nghe truyện khác.
- ‹ › hoặc vuốt ảnh: sang khung. Chạm ảnh / "Xem cả trang": xem cả trang.
- Dưới lời đọc có sẵn nút giọng **Tiếng Việt / Tiếng Anh / Anh → Việt** và nút **Nhạc: bật/tắt** (đổi giọng lúc đang đọc → đọc lại câu đó bằng giọng mới).
- **Truyện của tuần** (đầu tủ truyện): mỗi tuần 1 truyện, nghe lại 3 bậc: ① Tiếng Việt → ② Anh rồi Việt → ③ Tiếng Anh. Hết truyện ở bậc nào thì bậc đó được ✓. "Đổi truyện" để chọn truyện khác.
- **Hỏi cùng bé**: hết truyện (hoặc bấm "Hỏi & từ mới" giữa lúc đọc) hiện 3 câu hỏi song ngữ: ① Bài học là gì? (bấm "Xem bài học" để hiện đáp án) ② nhớ lại truyện ③ đặt mình vào vai / liên hệ đời sống. Ba mẹ đọc, bé trả lời.
- **5 từ mới** mỗi truyện: chạm để nghe phát âm tiếng Anh, kèm nghĩa tiếng Việt.
- ⚙ Cài đặt (cùng chức năng): giọng Tiếng Việt / Tiếng Anh / Anh rồi Việt · Nhạc ru nhẹ bật/tắt (nhạc tạo bằng code, không có file nhạc).
- Đã nghe ✓, ♥, giọng chọn → lưu trên máy người dùng, không cần tài khoản.
- Màn hình được giữ sáng khi đang đọc. Thêm vào màn hình điện thoại như app.

## Cấu Trúc

- `4-dung/app/` — app (đưa nguyên thư mục này lên host).
  - `du-lieu.js` — tự sinh, không sửa tay.
  - `anh/trang/` trang truyện WebP · `anh/bia/` ảnh bìa nhỏ · `am-thanh/NN/` giọng đọc (`ten`, `k1..k8`, `bh` × `vn`/`en`).
- `4-dung/cong-cu/xay-app.py` — dựng ảnh, khung, giọng, `du-lieu.js` từ dự án truyện tranh.
- `4-dung/cong-cu/do-khung.py` — dò 4 khung trên mỗi trang để phóng to. Trang không dò được dùng khung mẫu, phóng nhẹ hơn.
- Nguồn truyện + ảnh: `1-dau-vao/nguon.md`.

## Thêm / Sửa Truyện

1. Sửa lời trong dự án truyện tranh (`2-kich-ban/du-lieu/*.json`) hoặc thêm ảnh mới vào `3-tai-san/hinh/`.
- Câu hỏi + từ vựng viết tay trong `4-dung/cong-cu/noi-dung/hoi-tu.json` (80 truyện × 2 câu hỏi + 5 từ). Sửa ở đó rồi chạy lại script.
2. Chạy (chỉ làm phần còn thiếu):
   `python 4-dung/cong-cu/xay-app.py --nguon "J:/_Apps/ai-video-producer/du-an/2026-11-07-khac-truyen-tranh-dao-duc-80"`
   - Sửa lời 1 câu → xoá file mp3 của câu đó rồi chạy lại. `--lai-giong` thu lại hết.
   - Edge-tts hay chặn giọng HoaiMy khi gọi dồn → `--nn vn --song-song 2`.
3. Tăng `?v=` trong `index.html` và đổi `BAN` trong `sw.js` để máy người dùng lấy bản mới.

Giọng: Việt `vi-VN-HoaiMyNeural` (-12%), Anh `en-US-JennyNeural` (-15%, cùng giọng app Bé Học Tiếng Anh).

## Đăng Lên Mạng

- Link: https://yogacungngoclinh-yogi.github.io/truyen-dem-khuya/
- Repo: https://github.com/yogacungngoclinh-yogi/truyen-dem-khuya (công khai, GitHub Pages từ nhánh `main`).
- Cập nhật: commit + `git push` → khoảng 1 phút sau web có bản mới. Nhớ tăng `?v=` / `BAN` (xem trên).

## Nhật Ký

- 2026-11-07: dựng bản đầu. 80 truyện / 89 trang. Dò khung tự động 63/89 trang, 26 trang dùng khung mẫu. Thu 516 câu giọng Anh. Giọng Việt HoaiMy bị edge-tts chặn tạm khi thu dồn → thu lại chậm (2 câu cùng lúc).
- 2026-11-07: đẩy lên GitHub `yogacungngoclinh-yogi/truyen-dem-khuya`, bật GitHub Pages. Giọng Việt lúc đẩy: 442/516 câu, đang thu tiếp.
- 2026-11-07: đưa nút chọn giọng + bật/tắt nhạc ra ngay màn đọc (trước chỉ nằm trong ⚙, anh không thấy). Bản v3.
- 2026-11-07: thu đủ 516/516 câu giọng Việt (có giới hạn 60 giây mỗi câu để không treo). Đã đẩy lên web.
- 2026-11-07: thêm Hỏi cùng bé (3 câu song ngữ/truyện), Truyện của tuần 3 bậc, 5 từ mới + phát âm (328 từ). Dựa trên nghiên cứu ở `1-dau-vao/nghien-cuu-phat-trien-app.md`. Bản v4.
