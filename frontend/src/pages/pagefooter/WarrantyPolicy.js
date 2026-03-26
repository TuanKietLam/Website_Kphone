import React from "react";

function WarrantyPolicy() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📄 Chính sách bảo hành</h1>

      <div style={styles.card}>
        <h2 style={styles.heading}>1. Thời gian bảo hành</h2>
        <p>• Đổi mới 1:1 trong <strong>7 ngày</strong> đầu nếu lỗi kỹ thuật.</p>
        <p>• Sau 7 ngày: bảo hành theo chính sách của hãng.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>2. Điều kiện bảo hành</h2>
        <ul style={styles.list}>
          <li>Có hóa đơn</li>
          <li>Không có dấu hiệu rơi vỡ, vào nước, cong vênh.</li>
        </ul>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>3. Không bảo hành khi</h2>
        <ul style={styles.list}>
          <li>Rơi vỡ, vào nước.</li>
          <li>Tự ý sửa chữa tại nơi khác.</li>
          <li>Hư hỏng do sử dụng sai cách.</li>
        </ul>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>4. Thời gian xử lý</h2>
        <p>Từ <strong>7 – 14 ngày</strong> làm việc tùy theo hãng.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>5. Liên hệ hỗ trợ</h2>
        <p>📞 Hotline: 0383 823 316</p>
        <p>📧 Email: kphonecontact1@gmail.com</p>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "40px 20px", maxWidth: "900px", margin: "0 auto" },
  title: { fontSize: "34px", fontWeight: "700", marginBottom: "30px" },
  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    marginBottom: "25px",
  },
  heading: { fontSize: "22px", marginBottom: "10px", color: "#007bff" },
  list: { paddingLeft: "20px", lineHeight: "1.8" },
};

export default WarrantyPolicy;
