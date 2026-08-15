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


## v3.2 — Chức vụ học sinh
- Bổ sung cột **Chức vụ** trong danh sách học sinh.
- Có thể chọn trực tiếp: Lớp trưởng, Lớp phó, Tổ trưởng, Tổ phó, Cán sự môn, Cán sự khác.
- Chức vụ được lưu theo từng học sinh và tự động đi theo dữ liệu sao lưu.
- Nhập Excel hỗ trợ cột "Chức vụ"; xuất sổ điểm Excel cũng bao gồm cột này.
