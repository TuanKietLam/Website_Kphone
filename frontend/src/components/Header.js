

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { searchProducts, getCart, getImageUrl } from '../utils/api';
import { useQuery } from '@tanstack/react-query';
import {  HiOutlineShoppingCart,  HiOutlineMagnifyingGlass,  HiOutlineUser,} from "react-icons/hi2";
import { LuLogOut, LuSettings, LuPackage } from "react-icons/lu";


function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cartAnimate, setCartAnimate] = useState(false);

  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  /* ========================== LOAD USER ========================== */
  const loadUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
     const handleUserUpdate = () => loadUser();
      window.addEventListener('userUpdated', handleUserUpdate);

      return () => {
        window.removeEventListener('userUpdated', handleUserUpdate);
      };
  }, [location]);

  /* ========================== CART REACT QUERY ========================== */
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: !!localStorage.getItem('token'),
  });

  useEffect(() => {
    if (cartData?.items) {
      setCartCount(cartData.items.length);
      setCartAnimate(true);
      setTimeout(() => setCartAnimate(false), 300);
    }
  }, [cartData]);

  /* ========================== CLICK OUTSIDE MENU ========================== */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  /* ========================== SEARCH HANDLE ========================== */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await searchProducts(value);
      setSuggestions(res.products?.slice(0, 5) || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
  };

  /* ========================== RENDER JSX ========================== */
  return (
    <header style={styles.header}>
      <div className="container" style={styles.container}>

        {/* LOGO */}
        <Link to="/" style={styles.logo}>
          <img src="/images/logo.png" alt="KPhone" style={styles.logoImage} />
        </Link>

        {/* SEARCH BAR */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={handleInputChange}
              style={styles.searchInput}
            />
           <button type="submit" style={styles.searchButton}>
              <HiOutlineMagnifyingGlass size={22} />
            </button>
          </form>

          {/* GỢI Ý SEARCH */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={styles.suggestionBox}>
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/${item.id}`}
                  style={styles.suggestionItem}
                  onClick={() => setShowSuggestions(false)}
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    style={styles.suggestionImage}
                  />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* MENU PHẢI */}
        <div style={styles.rightMenu}>

          {/* GIỎ HÀNG */}
          <Link
            to="/cart"
            style={styles.iconButton}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.iconButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.iconButton)}
          >
            <HiOutlineShoppingCart 
              size={26}
              style={{
                transform: cartAnimate ? "scale(1.15)" : "scale(1)",
                transition: "0.2s ease",
              }}
            /> 
             <span style={styles.cartText}>Giỏ hàng</span>
            {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
          </Link>

          {/* USER MENU */}
          {user ? (
            <div style={styles.userMenuContainer} ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={styles.userButton}
              >
                <HiOutlineUser size={18} />
                <span style={{ marginLeft: "8px" }}>
                  {user.name.split(" ").pop()}
                </span>
              </button>

              {showUserMenu && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownHeader}>
                    <strong>{user.name}</strong>
                    <br></br>
                    <span style={styles.userEmail}>{user.email}</span>
                  </div>

                  <div style={styles.dropdownDivider} />

                  <Link to="/profile" style={styles.dropdownItem}>
                    <LuSettings size={18} /> Tài khoản
                  </Link>

                  <Link to="/orders" style={styles.dropdownItem}>
                    <LuPackage size={18} /> Đơn hàng
                  </Link>

                  {user.role === "admin" && (
                    <Link to="/admin" style={styles.dropdownItem}>
                      <LuSettings size={18} /> Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{ ...styles.dropdownItem, background: "none", border: "none" }}
                  >
                    <LuLogOut size={18} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.authButton}>Đăng nhập</Link>
              <Link to="/register" style={{ ...styles.authButton, ...styles.registerButton }}>
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* 🔥 ICON GIỎ HÀNG SVG CHUYÊN NGHIỆP */
const CartIcon = ({ isAnimating }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: isAnimating ? 'rotate(-12deg)' : 'none',
      transition: '0.15s ease'
    }}
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l3.6 7.59a2 2 0 0 0 1.7 1.1h9.72a2 2 0 0 0 1.9-1.37L23 6H6"></path>
  </svg>
);
/* ========================== STYLES ========================== */
const styles = {
  /* ================= HEADER ================= */
  header: {
    backgroundColor: "#ef6b2eff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 16px",       
    gap: "16px",
  },

  /* ================= LOGO ================= */
  logo: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    
  },

  logoImage: {
     height: "40px",       
      maxHeight: "100%",     
      objectFit: "contain",
      display: "block",
       borderRadius: "10px",
  },

  /* ================= SEARCH ================= */
  searchForm: {
    display: "flex",
    width: "100%",
    gap: "6px",
  },

  searchInput: {
    flex: 1,
    height: "36px",             
    padding: "0 12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
  },

  searchButton: {
    height: "36px",
    width: "44px",
    background: "#e5a039ff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  /* ================= SEARCH DROPDOWN ================= */
  suggestionBox: {
    position: "absolute",
    top: "42px",                
    width: "100%",
    background: "#fff",
    borderRadius: "12px",
    maxHeight: "260px",        
    overflowY: "auto",
    zIndex: 999,
    boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
    border: "1px solid #e5e7eb",
  },

  suggestionItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    color: "#111827",
    textDecoration: "none",
    fontSize: "14px",
    borderBottom: "1px solid #f1f5f9",
  },

  suggestionImage: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    objectFit: "cover",
    background: "#f3f4f6",
  },

  /* ================= RIGHT MENU ================= */
  rightMenu: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  iconButton: {
    position: "relative",
    color: "#ffffffff",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    transition: "0.2s ease",
     textDecoration: "none",
  textDecorationLine: "none",
  },

  iconButtonHover: {
    transform: "scale(1.1)",
    color: "#2ef527ff",
  },

  badge: {
    position: "absolute",
    top: "-4px",
    right: "-6px",
    background: "#e51c1cff",
    color: "#fff",
    borderRadius: "999px",
    minWidth: "18px",
    height: "18px",
    fontSize: "11px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ================= USER ================= */
  userMenuContainer: {
    position: "relative",
  },

  userButton: {
    height: "36px",             // 🔥 đồng bộ header
    padding: "0 14px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },

  dropdownMenu: {
    position: "absolute",
    top: "44px",
    right: 0,
    background: "#fff",
    minWidth: "220px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
    zIndex: 1001,
  },

  dropdownHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    fontSize: "14px",
  },

  dropdownDivider: {
    height: "1px",
    background: "#e5e7eb",
  },

  dropdownItem: {
    padding: "10px 16px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#111827",
    fontSize: "14px",
    cursor: "pointer",
  },

  /* ================= AUTH ================= */
  authButtons: {
    display: "flex",
    gap: "8px",
  },

  authButton: {
    height: "36px",
    padding: "0 14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    color: "#111827",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
  },

  registerButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
  },

  cartButton: {
  position: "relative",
  color: "#580808ff",
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",              
  cursor: "pointer",
  transition: "0.2s ease",
  textDecoration: "none",
  
},

cartButtonHover: {
  transform: "scale(1.05)",
  color: "#ffffff",
},

cartText: {
  fontSize: "14px",
  fontWeight: "500",
  color: "white",
  whiteSpace: "nowrap",
   textDecoration: "none",
},
};


export default Header;
