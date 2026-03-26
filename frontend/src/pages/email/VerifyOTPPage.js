
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [otp, setOtp] = useState("");
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
    if (!/^\d{6}$/.test(otp)) {
      setError("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Xác minh OTP thất bại");
      }

      // OTP hợp lệ -> chuyển sang trang reset password
      navigate("/reset-password");
    } catch (err) {
      setError(err.message || "Lỗi xác minh OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Không gửi được OTP");
      alert("Đã gửi lại mã OTP vào email của bạn. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setError(err.message || "Lỗi gửi lại OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={pageStyle}>
      <h2>Xác minh mã OTP</h2>
      <p>Chúng tôi đã gửi mã OTP đến email: <strong>{email}</strong></p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>Nhập mã OTP (6 chữ số)</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          style={inputStyle}
          placeholder="012345"
        />

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "Đang kiểm tra..." : "Xác minh OTP"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            style={secondaryBtn}
          >
            Gửi lại OTP
          </button>
        </div>
      </form>
    </div>
  );
}

/* ===== styles ===== */
const pageStyle = { maxWidth: 520, margin: "60px auto", padding: 20 };
const formStyle = { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 };
const labelStyle = { fontWeight: 600, marginBottom: 6 };
const inputStyle = {
  padding: "10px 12px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "220px",
};
const errorStyle = { color: "white", background: "#dc3545", padding: "8px 10px", borderRadius: 6, marginTop: 8 };
const primaryBtn = { padding: "10px 16px", background: "#007bff", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
const secondaryBtn = { padding: "10px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
