import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../utils/api';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Tên không được chứa số hoặc ký tự đặc biệt';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

   if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }
    setLoading(true);

    try {
    await register(formData);
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.error;
      if (message === "Email đã tồn tại") {
        setErrors({ email: "Email đã tồn tại", submit: "" });
      } else if (message === "Số điện thoại đã tồn tại") {
        setErrors({ phone: "Số điện thoại đã tồn tại", submit: "" });
      } else {
        setErrors({ submit: message || "Đăng ký thất bại" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  return (
    <div className="container" style={styles.page}>
      <div style={styles.formContainer}>
        <h1 style={styles.title}>Đăng ký tài khoản</h1>

        {errors.submit && <div style={styles.error}>{errors.submit}</div>}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.formGroup}>
            <label>Họ và tên *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nhập họ và tên"
              style={styles.input}
            />
            {errors.name && <span style={styles.fieldError}>{errors.name}</span>}
          </div>

          <div style={styles.formGroup}>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Nhập email (abc@gmail.com)"
              style={styles.input}
            />
            {errors.email && <span style={styles.fieldError}>{errors.email}</span>}
          </div>

          <div style={styles.formGroup}>
            <label>Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              inputMode="numeric"
              placeholder="Nhập số điện thoại"
              style={styles.input}
            />
            {errors.phone && <span style={styles.fieldError}>{errors.phone}</span>}
          </div>

          <div style={styles.formGroup}>
            <label>Mật khẩu *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              style={styles.input}
            />
            {errors.password && <span style={styles.fieldError}>{errors.password}</span>}
          </div>

          <div style={styles.formGroup}>
            <label>Xác nhận mật khẩu *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu"
              style={styles.input}
            />
            {errors.confirmPassword && (
              <span style={styles.fieldError}>{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p style={styles.loginLink}>
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
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
    maxWidth: '500px',
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
  form: {},
  formGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
  },
  fieldError: {
    color: '#dc3545',
    fontSize: '14px',
    display: 'block',
    marginTop: '5px',
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
    marginTop: '10px',
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '20px',
  },
};

export default RegisterPage;

