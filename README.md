# Tro Tàn Thịnh Vượng

Game xây dựng thành phố hậu tận thế dạng text, có minh họa, chơi ngay trên trình duyệt. Game lưu trên máy bạn, không cần tài khoản hay server.

> 31 năm sau Đêm Tro, bạn dẫn 12 người sống sót đến Trạm Bơm Số 7 bên Sông Hạ. Ở đây còn nước sạch và một tu-bin có thể sửa. Nhưng thứ gì tỏa nhiệt cũng gọi Tro tìm về.

**Chơi online:** bật GitHub Pages cho repo này (Settings → Pages → Branch `main`, thư mục `/`) rồi mở `https://dovanminhtoan119.github.io/trotanthinhvuong/`.

**Chơi trên máy:** tải repo về, chạy một web server tĩnh trong thư mục, ví dụ `python3 -m http.server`, rồi mở `http://localhost:8000`. Không mở thẳng file `index.html` được, vì trình duyệt chặn ES module khi chạy từ `file://`.

## Có gì trong bản chơi thử (Hồi I: Đốm Lửa)

- **30 ngày cốt truyện**, 13 sự kiện chính: sửa tu-bin, bí mật của Bác sĩ Linh, giọng nói của bé Tý, lũ mùa mưa, Hội Đèn Lồng cập bến.
- **Cơ chế Nhiệt:** máy móc và đông người làm thành phố nóng lên. Nhiệt cao kéo Tro đến: Bão Tro, Hình Nhân Tro, công trình mục nát.
- **17 loại công trình** trên 2 khu (Trạm Bơm, Bến Cảng), có điện, độ bền, sửa chữa, bật/tắt.
- **Cư dân có tên tuổi:** mỗi người có 8 kỹ năng, đặc điểm tính cách, sức khỏe, tinh thần, mức Tro nhiễm, ước nguyện riêng và vợ/chồng.
- **Thám hiểm 8 địa điểm**, mỗi nơi có cảnh riêng kèm lựa chọn và kiểm tra kỹ năng (hiện tỉ lệ thành công).
- **25 sự kiện ngẫu nhiên**, 7 đề tài nghiên cứu, 7 luật lệ không thể hủy.
- **3 Người Kể Chuyện** (độ khó), trong đó chế độ "Tro" là Ironman.
- **Nhật Ký Thành Phố** tự ghi lại biên niên sử, cùng **Codex** mở dần về thế giới.
- **Minh họa SVG vẽ bằng code:** cảnh thành phố thay đổi theo từng công trình, mùa, ngày/đêm, Tro rơi theo mức Nhiệt. Ngoài ra có tranh cho từng sự kiện và chân dung riêng cho từng cư dân. Game không dùng ảnh ngoài nên không vướng bản quyền.

## Lưu game

- Tự động lưu mỗi sáng, kèm 2 bản dự phòng xoay vòng.
- 3 ô lưu tay (trừ chế độ Ironman).
- Xuất ra file `.tro` hoặc sao chép mã save để chuyển sang máy khác. Save có checksum chống hỏng và số phiên bản để tự nâng cấp khi game cập nhật.
- Ngẫu nhiên dùng seed lưu trong save, nên tải lại save không đổi được kết quả.
- Save nằm trong trình duyệt. **Xóa dữ liệu trình duyệt là mất save**, nên hãy xuất file định kỳ.

## Cấu trúc code

```
index.html          khung trang
css/style.css       giao diện (desktop + điện thoại)
js/data.js          dữ liệu: công trình, nghiên cứu, luật, địa điểm, codex
js/events.js        nội dung: cốt truyện, sự kiện, cảnh thám hiểm
js/game.js          engine: luật tính toán, ngày/đêm, sự kiện, lưu game (không đụng DOM)
js/art.js           minh họa SVG tự sinh
js/ui.js            giao diện và xử lý thao tác
sw.js               chơi offline (PWA)
test/sim.mjs        bot tự chơi để kiểm thử engine
```

Muốn thêm sự kiện, chỉ cần thêm một object vào `EVENTS` trong `js/events.js`, không phải sửa engine.

Kiểm thử: `node test/sim.mjs 40` cho bot chơi 40 ván Hồi I với seed khác nhau.

## Lộ trình

- [x] Hồi I: Đốm Lửa (bản chơi thử)
- [ ] Hồi II: Dòng Sông: mở thêm khu, phe phái, ngoại giao, chợ trao đổi
- [ ] Hồi III: Tiếng Vọng: tầng hầm trạm bơm, bí mật HỒI SINH
- [ ] Hồi IV: Mùa Tro, cùng 5 kết thúc
