import React from "react";

function PurchaseGuide() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🛒 Hướng dẫn mua hàng</h1>

      <div style={styles.card}>
        <h2 style={styles.heading}>Bước 1: Chọn sản phẩm</h2>
        <p>Truy cập danh sách sản phẩm và chọn mẫu bạn muốn mua.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>Bước 2: Thêm vào giỏ hàng</h2>
        <p>Nhấn “Thêm vào giỏ hàng” và tiếp tục chọn sản phẩm khác.</p>
        <p>Hoặc có thể mua ngay trong phần chi tiết sản phẩm.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>Bước 3: Kiểm tra giỏ hàng</h2>
        <p>Xem lại số lượng và giá sản phẩm trước khi thanh toán.</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.heading}>Bước 4: Thanh toán</h2>
        <p>
          Chọn hình thức thanh toán (COD hoặc MoMo) và nhập thông tin giao hàng.
        </p>
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
};

export default PurchaseGuide;
