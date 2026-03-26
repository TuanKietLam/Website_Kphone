

import React, { useEffect,useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartItem, removeFromCart, getImageUrl } from '../utils/api';

function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState([]);


   // 🧹 Reset Buy Now mode khi vào giỏ hàng
  useEffect(() => {
    localStorage.removeItem("checkoutMode");
    localStorage.removeItem("buyNowItem");
  }, []);

  // Lấy giỏ hàng
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: !!localStorage.getItem('token'),
  });

  // Mutation để cập nhật số lượng
  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation để xóa sản phẩm
  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Xử lý cập nhật số lượng
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemove(productId);
    } else {
      updateMutation.mutate({
        product_id: productId,
        new_quantity: newQuantity,
      });
    }
  };

  // Xử lý xóa sản phẩm
  const handleRemove = (productId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      removeMutation.mutate({ product_id: productId });
    }
  };

  const toggleSelect = (productId) => {
      setSelectedItems((prev) => {
        if (prev.includes(productId)) {
          return prev.filter((id) => id !== productId); // bỏ chọn
        }
        return [...prev, productId]; // chọn thêm
      });
    };

  // Xử lý checkout
  const handleCheckout = () => {
  const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn sản phẩm cần thanh toán");
      return;
    }

    // ⭐ Lưu danh sách sản phẩm được chọn
    localStorage.setItem("checkoutMode", "selected");
    localStorage.setItem("selectedItems", JSON.stringify(selectedItems));

    navigate("/checkout");
  };

  if (!localStorage.getItem('token')) {
    return (
      <div className="container" style={styles.page}>
        <h1>Giỏ hàng</h1>
        <p>Vui lòng đăng nhập để xem giỏ hàng</p>
        <Link to="/login">Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container">Đang tải giỏ hàng...</div>;
  }

  const items = cartData?.items || [];
  const total = cartData?.total || 0;
  const selectedTotal = items
  .filter(item => selectedItems.includes(item.product_id))
  .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Giỏ hàng của tôi</h1>

      {items.length === 0 ? (
        <div style={styles.emptyCart}>
          <p>Giỏ hàng của bạn đang trống</p>
          <Link to="/products" style={styles.shopButton}>
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <>     
              {items.map((item) => (
                <div key={item.id} style={styles.cartItem}>

                 {/* Cột 1: Checkbox */}
                  <div style={styles.columnCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.product_id)}
                      onChange={() => toggleSelect(item.product_id)}
                      style={styles.checkbox}
                    />
                  </div>

                  {/* Cột 2: Ảnh + Tên + Giá */}
                  <div style={styles.columnLeft}>
                    <div style={styles.imageBox}>
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        style={styles.productImage}
                      />
                    </div>

                    <div style={styles.productInfo}>
                      <p style={styles.productName}>{item.name}</p>
                      <p style={styles.price}>
                        {new Intl.NumberFormat("vi-VN").format(item.price)} đ
                      </p>
                    </div>
                  </div>

                  {/* Cột 3: Số lượng + Tổng giá + Xóa */}
                  <div style={styles.columnRight}>
                    <div style={styles.quantityControl}>
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        style={styles.quantityButton}
                      >
                        -
                      </button>

                      <span style={styles.quantity}>{item.quantity}</span>

                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        style={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>

                    <p style={styles.totalPrice}>
                      {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)} đ
                    </p>

                    <button
                      onClick={() => handleRemove(item.product_id)}
                      style={styles.removeButton}
                    >
                      Xóa
                    </button>
                  </div>

                </div>
              ))}



          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>Tổng tiền:</span>
              <strong style={styles.totalAmount}>
               {new Intl.NumberFormat('vi-VN').format(selectedTotal)} đ
              </strong>
            </div>
            <button onClick={handleCheckout} style={styles.checkoutButton}>
              Thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '40px 20px',
  },

  title: {
    fontSize: '32px',
    marginBottom: '30px',
  },

  emptyCart: {
    textAlign: 'center',
    padding: '60px 20px',
  },

  /* ============================
      🆕 CARD SẢN PHẨM 
  ============================= */
  imageBox: {
    width: "110px",
    height: "110px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    background: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",       // GIỮ FORM CHUẨN
  },

  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",   // FIX
    padding: "20px",
    marginBottom: "20px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
    minHeight: "130px",         // FIX
  },

  productLeft: {
     display: "flex",
     alignItems: "flex-start",
     gap: "20px",
  },

  productRight: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
  },

  productImage: {
      width: "100%",
  height: "100%",
  objectFit: "contain", 
  },

  productInfo: {
     maxWidth: "260px",
     minHeight: "60px",          // FIX
     display: "flex",
     flexDirection: "column",
     justifyContent: "space-between",
  },

  productName: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "5px",
  },

  price: {
    fontSize: "15px",
    color: "#28a745",
    fontWeight: "600",
  },

  totalPrice: {
    fontWeight: "700",
    fontSize: "17px",
    minWidth: "110px",
    textAlign: "right",
  },

  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  quantityButton: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #aaa",
    cursor: "pointer",
    background: "#fff",
    fontSize: "18px",
    fontWeight: "600",
  },

  quantity: {
    minWidth: "28px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
  },

  removeButton: {
    padding: "6px 15px",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    marginRight: "15px",
  },

  /* ============================
      TỔNG KẾT 
  ============================= */
  summary: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '400px',
    marginLeft: 'auto',
  },

  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    fontSize: '18px',
  },

  totalAmount: {
    fontSize: '24px',
    color: '#007bff',
  },

  checkoutButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#04861aff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    cursor: 'pointer',
  },

  /////
  columnCheckbox: { 
  width: "50px",
  display: "flex",
  justifyContent: "center",
  paddingTop: "10px"
},

columnLeft: {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "20px",
},

columnRight: {
  width: "400px",          // tăng không gian
  display: "flex",
  alignItems: "center",
  gap: "30px",             // 🔥 thêm khoảng cách cố định
  justifyContent: "flex-end", 
},
};


export default CartPage;

