import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartBar,  FaBoxOpen,  FaList,  FaTrademark,  FaShoppingBag,  FaUsers,  FaTicketAlt,  FaSignOutAlt,
  FaArrowLeft,  FaUserShield,} from "react-icons/fa";

function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        // Kiểm tra quyền admin
        if (userData.role !== 'admin') {
          navigate('/');
        }
      } catch (e) {
        navigate('/');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLoggedOut'));
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Thống kê', icon: <FaChartBar /> },
    { path: '/admin/products', label: 'Sản phẩm', icon: <FaBoxOpen /> },
    { path: '/admin/categories', label: 'Danh mục',icon: <FaList /> },
    { path: '/admin/brands', label: 'Thương hiệu', icon: <FaTrademark /> },
    { path: '/admin/orders', label: 'Đơn hàng', icon: <FaShoppingBag /> },
    { path: '/admin/users', label: 'Người dùng', icon: <FaUsers /> },
    { path: '/admin/coupons', label: 'Mã giảm giá', icon: <FaTicketAlt /> },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>
            <span style={styles.logoText}><FaUserShield /> Admin</span>
          </h2>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {}),
              }}
            >
               <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <Link to="/" style={styles.backToSite}>
             <FaArrowLeft style={{ marginRight: 6 }} /> Về trang chủ
          </Link>
          {user && (
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.name}</div>
              <div style={styles.userEmail}>{user.email}</div>
              <button onClick={handleLogout} style={styles.logoutButton}>
               <FaSignOutAlt style={{ marginRight: 6 }} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#3f385aff',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #34495e',
  },
  logo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
  },
  nav: {
    flex: 1,
    padding: '10px 0',
  },
  navItem: {
    display: 'block',
    padding: '12px 20px',
    color: '#ecf0f1',
    textDecoration: 'none',
    transition: 'all 0.3s',
    fontSize: '15px',
  },
  navItemActive: {
    backgroundColor: '#656161ff',
    borderLeft: '4px solid #a8a9a9ff',
    paddingLeft: '16px',
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid #34495e',
  },
  backToSite: {
    display: 'block',
    padding: '10px',
    color: '#ecf0f1',
    textDecoration: 'none',
    borderRadius: '5px',
    marginBottom: '15px',
    textAlign: 'center',
    backgroundColor: '#34495e',
    transition: 'background-color 0.3s',
  },
  userInfo: {
    fontSize: '13px',
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  userEmail: {
    color: '#bdc3c7',
    marginBottom: '10px',
    fontSize: '12px',
  },
  logoutButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background-color 0.3s',
  },
  main: {
    flex: 1,
    marginLeft: '250px',
    minHeight: '100vh',
  },
  content: {
    padding: '30px',
  },
  navIcon: {
  width: "22px",
  fontSize: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
},
navItem: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 20px",
  color: "#ecf0f1",
  textDecoration: "none",
  transition: "all 0.25s ease",
  fontSize: "15px",
},
navItemHover: {
  backgroundColor: "#4b4374",
},
};

export default AdminLayout;

