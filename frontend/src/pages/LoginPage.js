
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../utils/api';

function LoginPage() {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // CODE MỚI — Xử lý quên mật khẩu
  const handleForgotPassword = async () => {

    let email = emailOrPhone; 

    if (!email) {
      email = prompt("Vui lòng nhập email đã đăng ký:");
      if (!email) return;
    }

    if (!window.confirm(`Gửi mã OTP đến email: ${email}?`)) return;

    try {
      const res = await fetch("http://localhost:5002/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không gửi được OTP");
      }


      localStorage.setItem("resetEmail", email);

      alert("OTP đã được gửi vào email của bạn!");

      // Điều hướng qua trang nhập mã OTP
      navigate("/verify-otp");

    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Xử lý submit form login
  const handleSubmit = async (e) => {
    e.preventDefault();

    localStorage.removeItem('token');
    localStorage.removeItem('user');

     if (!emailOrPhone) {
    setError('Vui lòng nhập email hoặc số điện thoại');
    return;
      }

      if (!password) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }
    setError('');
    setLoading(true);

    try {
      const response = await login({ emailOrPhone, password });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      window.dispatchEvent(new Event('userLoggedIn'));

      const returnUrl = new URLSearchParams(window.location.search).get('return') || '/';
      navigate(returnUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={styles.page}>
      <div style={styles.formContainer}>
        <h1 style={styles.title}>Đăng nhập</h1>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.formGroup}>
            <label>Email hoặc Số điện thoại</label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              style={styles.input}
              placeholder="Nhập email hoặc số điện thoại"
            />
          </div>

          <div style={styles.formGroup}>
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <div style={styles.options}>
            {/* BUTTON QUÊN MẬT KHẨU */}
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                ...styles.forgotPassword,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0
              }}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p style={styles.signupLink}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)',
  },
  formContainer: {
    maxWidth: '400px',
    width: '100%',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '32px',
    marginBottom: '30px',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  formGroup: { marginBottom: '20px' },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  forgotPassword: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: "15px"
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  signupLink: { textAlign: 'center' },
};

export default LoginPage;
