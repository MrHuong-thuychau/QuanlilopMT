# Thủy Châu Art Class Manager — bản nền v2.0 nâng cấp ổn định
Bản này được xây dựng lại trực tiếp từ cấu trúc v2.0 để giữ nguyên các chức năng đã ổn định: quản lý lớp, nhập Excel, học sinh, điểm danh, sơ đồ chỗ ngồi kéo-thả, sao lưu.
## Nâng cấp Mĩ thuật
- TX1, TX2, TX3, Giữa kỳ, Cuối kỳ.
- Giá trị điểm: CĐ hoặc 5–10, bước 0,5.
- CĐ là trạng thái riêng, không phải số.
- Xếp loại cuối kỳ: Đạt/Chưa đạt.
- Nhận xét cuối kỳ + ngân hàng mẫu nhận xét tùy chỉnh.
- Nhập điểm trực tiếp trên bảng và lưu ngay.
- Tổng quan không tính điểm trung bình: Đạt/CĐ, tỷ lệ, điểm 9/10, học sinh năng khiếu (có ít nhất một điểm >=9).
- Xuất Excel gồm điểm, xếp loại và nhận xét.


## v3.1 — Màu phân loại điểm
- 8,5–10: đỏ — Giỏi
- 6,5–8,0: xanh — Khá
- 5,0–6,0: tím — Trung bình
- CĐ: đen/xám — Chưa đạt
- Màu tự cập nhật theo điểm khi nhập/sửa.


## Tiêu chí học sinh có năng khiếu — bản cuối
Học sinh được thống kê là "Có năng khiếu" khi có **ít nhất 3 trong 5 cột TX1, TX2, TX3, GK, CK đạt từ 9,0 trở lên**.


## v3.2 — Sao lưu, báo cáo và khóa sổ
- Tự lưu dữ liệu sau mỗi thao tác vào trình duyệt.
- Xuất/khôi phục bản sao JSON.
- Xuất toàn bộ lớp ra một file Excel; xuất sổ điểm từng lớp.
- In danh sách lớp và in sổ điểm.
- Khóa/mở khóa sổ điểm theo từng lớp; khi khóa không thể sửa điểm hoặc xếp loại.
- Giữ nguyên tiêu chí học sinh có năng khiếu: ít nhất 3/5 cột TX1, TX2, TX3, GK, CK đạt từ 9 trở lên.


## v3.3 — Đồng bộ cloud đa thiết bị
### Mô hình
- Máy vẫn lưu cục bộ để dùng khi mất mạng.
- Google Sheets + Apps Script làm kho dữ liệu trung tâm.
- Có 3 thao tác: **Đẩy lên cloud**, **Tải từ cloud**, **Đồng bộ hai chiều**.
- Có tùy chọn tự động đẩy sau khi lưu.
- Có mã đồng bộ (`SYNC_KEY`) để tránh người lạ ghi dữ liệu.

### Thiết lập cloud
1. Tạo một Google Sheet riêng, ví dụ `Du lieu Quan ly lop Mi thuat`.
2. Vào **Extensions → Apps Script**.
3. Dán toàn bộ nội dung `google-apps-script.gs`.
4. Vào **Project Settings → Script properties → Add script property**:
   - Name: `SYNC_KEY`
   - Value: một mã bí mật dài, ví dụ `TCMT-2026-Huong-8f2k9x`
5. **Deploy → New deployment → Web app**.
6. Execute as: **Me**. Who has access: **Anyone**.
7. Copy URL kết thúc bằng `/exec`.
8. Trong app: **Cài đặt → Đồng bộ**, dán URL và đúng mã `SYNC_KEY` → **Lưu cấu hình cloud** → **Đẩy lên cloud**.
9. Trên máy khác, mở website, nhập cùng URL + mã → **Tải từ cloud**.

### Khuyến nghị
- Sau khi cấu hình lần đầu, dùng **Đồng bộ hai chiều**.
- Vẫn giữ chức năng **Xuất bản sao JSON** để có bản sao dự phòng.
- Không chia sẻ URL Web App và `SYNC_KEY` công khai.
