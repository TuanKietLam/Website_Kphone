
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const e = localStorage.getItem("resetEmail");
    if (!e) {
      navigate("/login");
      return;
    }
    setEmail(e);
  }, [navigate]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Mật khẩu phải tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Lỗi reset mật khẩu");

      // thành công -> xóa resetEmail và quay về login
      localStorage.removeItem("resetEmail");
      alert("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={pageStyle}>
      <h2>Tạo mật khẩu mới</h2>
      <p>Email: <strong>{email}</strong></p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>Mật khẩu mới</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={inputStyle}
          placeholder="Tối thiểu 6 ký tự"
        />

        <label style={labelStyle}>Xác nhận mật khẩu</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
          placeholder="Nhập lại mật khẩu"
        />

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* reuse same styles as OTP page */
const pageStyle = { maxWidth: 520, margin: "60px auto", padding: 20 };
const formStyle = { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 };
const labelStyle = { fontWeight: 600, marginBottom: 6 };
const inputStyle = {
  padding: "10px 12px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
  maxWidth: 420,
};
const errorStyle = { color: "white", background: "#dc3545", padding: "8px 10px", borderRadius: 6, marginTop: 8 };
const primaryBtn = { padding: "10px 16px", background: "#007bff", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
