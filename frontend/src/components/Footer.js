/**
 * Component Footer - Chân trang website (phiên bản có icon)
 */

import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.container}>

        {/* ABOUT */}
        <div style={styles.section}>
          <h3 style={styles.title}>Về chúng tôi</h3>
          <p style={styles.text}>KPhone - Cửa hàng điện thoại uy tín</p>
          <p style={styles.text}>📞 Hotline: 0383 823 316</p>
          <p style={styles.text}>📧 Email: kphonecontact1@gmail.com</p>
        </div>

        {/* SUPPORT */}
        <div style={styles.section}>
          <h3 style={styles.title}>Hỗ trợ khách hàng</h3>
          <Link to="/warranty-policy" style={styles.link}>Chính sách bảo hành</Link>
          <Link to="/purchase-guide" style={styles.link}>Hướng dẫn mua hàng</Link>
          <Link to="/faq" style={styles.link}>Câu hỏi thường gặp</Link>
        </div>

        {/* SOCIAL */}
        <div style={styles.section}>
          <h3 style={styles.title}>Kết nối với chúng tôi</h3>

          <div style={styles.socialRow}>

            {/* FACEBOOK */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={styles.socialIconBox}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#ffffff"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                style={styles.socialIcon}
              >
                <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.334v21.333C0 23.403.597 24 1.325 24h11.494v-9.294H9.691V11.01h3.128V8.414c0-3.1 1.893-4.787 4.659-4.787 1.325 0 2.464.099 2.797.143v3.24h-1.92c-1.506 0-1.797.716-1.797 1.764v2.316h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.667V1.334C24 .598 23.403 0 22.675 0z"/>
              </svg>
            </a>

            {/* INSTAGRAM */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={styles.socialIconBox}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#ffffff"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                style={styles.socialIcon}
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.206.056 2.003.246 2.47.413a4.92 4.92 0 011.675 1.088 4.92 4.92 0 011.088 1.675c.167.467.357 1.264.413 2.47.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.206-.246 2.003-.413 2.47a4.92 4.92 0 01-1.088 1.675 4.92 4.92 0 01-1.675 1.088c-.467.167-1.264.357-2.47.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.206-.056-2.003-.246-2.47-.413a4.92 4.92 0 01-1.675-1.088 4.92 4.92 0 01-1.088-1.675c-.167-.467-.357-1.264-.413-2.47C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.206.246-2.003.413-2.47A4.92 4.92 0 013.734 2.88 4.92 4.92 0 015.409 1.792c.467-.167 1.264-.357 2.47-.413C9.146 1.175 9.526 1.163 12 1.163m0-1.163C8.741 0 8.332.012 7.052.07 5.775.128 4.897.325 4.158.635A6.181 6.181 0 001.24 3.553c-.31.739-.507 1.617-.565 2.894C.618 7.726.606 8.135.606 12c0 3.865.012 4.274.07 5.553.058 1.277.255 2.155.565 2.894a6.181 6.181 0 002.918 2.918c.739.31 1.617.507 2.894.565 1.28.058 1.689.07 5.558.07 3.87 0 4.278-.012 5.558-.07 1.277-.058 2.155-.255 2.894-.565a6.181 6.181 0 002.918-2.918c.31-.739.507-1.617.565-2.894.058-1.279.07-1.688.07-5.553 0-3.865-.012-4.274-.07-5.553-.058-1.277-.255-2.155-.565-2.894A6.181 6.181 0 0020.447.635C19.708.325 18.83.128 17.553.07 16.273.012 15.865 0 12 0z"/>
                <circle cx="12" cy="12" r="3.5"/>
              </svg>
            </a>

          </div>
        </div>

      </div>
    </footer>
  );
}


/* ================================
      STYLE FOOTER
================================ */
const styles = {
  footer: {
    backgroundColor: "#222831",
    color: "#eeeeee",
    marginTop: "40px",
    paddingTop: "40px",
    borderTop: "4px solid #00ADB5",
  },

  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "30px",
    padding: "20px",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  title: {
    fontSize: "25px",
    fontWeight: "700",
    marginBottom: "10px",
  },

  text: {
    color: "#dcdcdc",
    fontSize: "15px",
  },

  link: {
    color: "#14e2caff",
    textDecoration: "none",
    fontSize: "15px",
    transition: "0.25s",
  },

  linkHover: {
    color: "#00ADB5",
  },

  /* ICON ROW */
  socialRow: {
    display: "flex",
    gap: "15px",
    marginTop: "10px",
  },

  socialIconBox: {
    width: "42px",
    height: "42px",
    backgroundColor: "#979a9fff",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "0.25s",
  },

  socialIcon: {
    transition: "0.25s",
  },

  socialIconBoxHover: {
    backgroundColor: "#00ADB5",
  },

  bottomBar: {
    backgroundColor: "#1b1f24",
    textAlign: "center",
    padding: "15px 0",
    marginTop: "25px",
  },

  bottomText: {
    margin: 0,
    color: "#aaaaaa",
    fontSize: "14px",
  },
};

export default Footer;
