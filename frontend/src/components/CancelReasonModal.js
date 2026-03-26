import React, { useState } from "react";

function CancelReasonModal({ onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState("");

  const reasons = [
    "Tôi muốn đổi địa chỉ giao hàng",
    "Tôi đặt nhầm sản phẩm",
    "Tôi không muốn mua nữa",
    "Khác", 
  ];

  const handleSubmit = () => {
    if (!selectedReason) {
      alert("Vui lòng chọn lý do hủy đơn.");
      return;
    }

    onSubmit(selectedReason); 
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <h3 style={styles.title}>Lý do hủy đơn hàng</h3>

        {/* Danh sách lý do */}
        <div style={styles.list}>
          {reasons.map((reason) => (
            <label key={reason} style={styles.item}>
              <input
                type="radio"
                name="cancel_reason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
              />
              {reason}
            </label>
          ))}
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelBtn}>Đóng</button>
          <button onClick={handleSubmit} style={styles.confirmBtn}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  box: {
    width: "400px",
    background: "white",
    padding: "20px",
    borderRadius: "10px",
  },
  title: {
    marginBottom: "15px",
    fontSize: "18px",
    fontWeight: "600",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  item: {
    fontSize: "15px",
  },
  actions: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  cancelBtn: {
    padding: "8px 14px",
    background: "#ccc",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "8px 14px",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default CancelReasonModal;
