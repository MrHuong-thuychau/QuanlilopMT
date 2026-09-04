# THỦY CHÂU ART CLASS MANAGER V4.0

## Đồng bộ V4.0
- `XUẤT BẢN TOÀN BỘ lên Cloud`: dùng trên máy có bộ dữ liệu chuẩn. Cloud được backup trước khi thay thế.
- `Tải NGUYÊN TRẠNG từ Cloud`: dùng cho máy mới/thiết bị phụ; thay thế dữ liệu cục bộ bằng đúng dữ liệu Cloud.
- `Đồng bộ hai chiều`: sau khi các máy đã cùng một baseline. Server dùng version để từ chối ghi đè nếu Cloud đã thay đổi.
- Cloud trả checksum và client xác nhận checksum logic trước khi báo thành công.

## Cài Apps Script
1. Mở Google Sheet dữ liệu. Extensions → Apps Script.
2. Dán toàn bộ `google-apps-script.gs`.
3. Script Properties: `SYNC_KEY` = một mã bí mật mới. Không dùng mã đã từng công khai.
4. Deploy → New deployment → Web app → Execute as Me → Who has access Anyone.
5. Nếu sửa Apps Script sau khi deploy, tạo deployment/version mới và dùng URL `/exec` của deployment đang hoạt động.

## Quy trình an toàn lần đầu
1. Trên máy đang có dữ liệu chuẩn: xuất JSON backup.
2. Tạm tắt Auto Sync trên các máy khác.
3. Cấu hình URL + SYNC_KEY trên máy chuẩn.
4. Bấm `XUẤT BẢN TOÀN BỘ lên Cloud`.
5. Chỉ khi app báo `Cloud đã nhận ĐÚNG toàn bộ dữ liệu` mới sang máy khác.
6. Máy khác bấm `Tải NGUYÊN TRẠNG từ Cloud`.
7. Kiểm tra số lớp/học sinh.
8. Sau khi tất cả cùng baseline, mới bật `Tự động đồng bộ`.
