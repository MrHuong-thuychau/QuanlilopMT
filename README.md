# THỦY CHÂU ART CLASS MANAGER — V4.0.3

V4 chạy trên GitHub; V5 chạy trực tiếp trên Google Apps Script. Google Sheets của V5 là **nguồn dữ liệu trung tâm**.

## Lần đầu kết nối V4 với dữ liệu V5
1. Mở V4 → Cài đặt.
2. Kiểm tra URL Web App V5 và mã đồng bộ.
3. Bấm **🟦 Lấy dữ liệu V5 làm dữ liệu nền**.
4. Kiểm tra V4 đã có 16 lớp / 655 học sinh.
5. Sau đó mới dùng **🔄 Đồng bộ hai chiều**.

V4.0.3 ghi một cờ nối cầu trong trình duyệt. Trước khi cờ này được thiết lập, nút đồng bộ hai chiều sẽ **không merge dữ liệu cũ của V4** vào V5; V4 sẽ lấy nguyên trạng dữ liệu đang chạy ổn trên V5. Sau khi nối cầu, hai bên mới hợp nhất theo `_syncMeta` và version.

## Nguyên tắc an toàn
- Không dùng **⭐ XUẤT BẢN TOÀN BỘ** trên V4 để ghi đè V5 nếu không thực sự cần.
- V5/Google Sheets là dữ liệu chuẩn hiện tại.
- Có thể dùng **📥 Tải NGUYÊN TRẠNG từ Cloud** để đưa V4 về đúng dữ liệu V5 bất cứ lúc nào.
