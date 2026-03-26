import React from "react";

function FAQ() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>❓ Câu hỏi thường gặp (FAQ)</h1>

      <div style={styles.card}>
        <h2 style={styles.question}>1. Thời gian giao hàng?</h2>
        <p>• Từ 1–3 ngày nội thành và 3–7 ngoài tỉnh khác.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.question}>2. Có hỗ trợ đổi trả không?</h2>
        <p>• Có, theo chính sách đổi trả của Shop.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.question}>3. Bảo hành bao lâu?</h2>
        <p>• 12 tháng với máy và 6 tháng với phụ kiện.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.question}>4. Có hỗ trợ thanh toán MoMo?</h2>
        <p>• Có, bạn có thể thanh toán trực tiếp qua MoMo.</p>
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
    marginBottom: "20px",
  },
  question: { fontSize: "20px", color: "#007bff", marginBottom: "5px" },
};

export default FAQ;
