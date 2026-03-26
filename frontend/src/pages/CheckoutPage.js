import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCart,
  createOrder,
  applyCoupon,
  getUserProfile,
  getAvailableCoupons,
  createMoMoPayment,
  getImageUrl,
  removeFromCart,
} from "../utils/api";

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ===============================
     CHECKOUT MODE
  =============================== */
  let checkoutMode = localStorage.getItem("checkoutMode") || "cart";
  let buyNowItem = null;

  try {
    buyNowItem = JSON.parse(localStorage.getItem("buyNowItem") || "null");
  } catch {
    buyNowItem = null;
  }

  const selectedItems = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedItems") || "[]");
    } catch {
      return [];
    }
  }, []);

  if (checkoutMode === "buyNow" && !buyNowItem) {
    checkoutMode = "cart";
    localStorage.setItem("checkoutMode", "cart");
  }


  useEffect(() => {
    if (checkoutMode === "buyNow" && !buyNowItem) navigate("/cart");
    if (checkoutMode === "selected" && selectedItems.length === 0) {
      localStorage.setItem("checkoutMode", "cart");
    }
    }, [checkoutMode, buyNowItem, selectedItems, navigate]);

    /* ===============================
      STATE
    =============================== */
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [autoApplyDisabled, setAutoApplyDisabled] = useState(false);
    const [userSelectedCoupon, setUserSelectedCoupon] = useState(false);
    const [recipientName, setRecipientName] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [shippingArea, setShippingArea] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [errors, setErrors] = useState({});

    const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: checkoutMode !== "buyNow",
   });

   const { data: userData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    });

    const {
    data: couponsData,
    isLoading: couponsLoading,
    } = useQuery({
    queryKey: ["available-coupons"],
    queryFn: getAvailableCoupons,
    });

   useEffect(() => {
    if (userData?.user) {
      setRecipientName(userData.user.name || "");
      setRecipientPhone(userData.user.phone || "");
      setShippingAddress(userData.user.address || "");
    }
  }, [userData]);

  /* ===============================
     CALCULATE PRICE
  =============================== */
 const shippingFee =
  shippingArea === "inner"? 20000 : shippingArea === "outer"? 50000 : shippingArea === "store"? 0 : 0;

  let subtotal = 0;

  if (checkoutMode === "buyNow" && buyNowItem) {
    subtotal = buyNowItem.price * buyNowItem.quantity;
  } else if (checkoutMode === "selected" && cartData?.items) {
    subtotal = cartData.items
      .filter((item) => selectedItems.includes(item.product_id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  } else {
    subtotal = cartData?.total || 0;
  }

  
 useEffect(() => {
  if (!appliedCoupon) {
    setUserSelectedCoupon(false);
    setAutoApplyDisabled(false);
  }
}, [subtotal]);

  /* ===============================
     APPLY COUPON MUTATION
  =============================== */
  const applyCouponMutation = useMutation({
    mutationFn: applyCoupon,
    onSuccess: (data) => setAppliedCoupon(data),
  });


  const bestCoupon = useMemo(() => {
    if (!couponsData?.coupons || subtotal <= 0) return null;

    let best = null;
    let maxDiscount = 0;

    for (const coupon of couponsData.coupons) {
      if (subtotal < coupon.min_order_amount) continue;

      let discount =
        coupon.discount_type === "percentage"
          ? (subtotal * coupon.discount_value) / 100
          : coupon.discount_value;

      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        best = coupon;
      }
    }

    return best;
  }, [couponsData, subtotal]);

  /* ===============================
     AUTO APPLY BEST COUPON
  =============================== */
  useEffect(() => {
      if (autoApplyDisabled) return;
      if (userSelectedCoupon) return;
      if (!bestCoupon) return;
      if (appliedCoupon?.coupon?.code === bestCoupon.code) return;

      setCouponCode(bestCoupon.code);
      applyCouponMutation.mutate({
        code: bestCoupon.code,
        subtotal,
      });
    }, [
      bestCoupon,
      subtotal,
      appliedCoupon,
      autoApplyDisabled,
      userSelectedCoupon,
    ]);

  /* ===============================
     COUPON HANDLERS
  =============================== */
 const handleApplyCoupon = () => {
  if (!couponCode.trim()) return;
  setUserSelectedCoupon(true);   
  setAutoApplyDisabled(true);    
  applyCouponMutation.mutate({
    code: couponCode,
    subtotal,
  });
  }

 const handleSelectCoupon = (coupon) => {
  if (subtotal < coupon.min_order_amount) return;
  setUserSelectedCoupon(true);   
  setAutoApplyDisabled(true);    
  setCouponCode(coupon.code);
  applyCouponMutation.mutate({
    code: coupon.code,
    subtotal,
  });
  };

  const handleRemoveCoupon = () => {
  setCouponCode("");
  setAppliedCoupon(null);
  setUserSelectedCoupon(true);
  setAutoApplyDisabled(true);
};

  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shippingFee - discount;

  /* ===============================
     CREATE ORDER
  =============================== */
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (data) => {
      const order = data.order;

      if (checkoutMode !== "buyNow" && cartData?.items) {
        const itemsToRemove =
          checkoutMode === "selected"
            ? cartData.items.filter((i) =>
                selectedItems.includes(i.product_id)
              )
            : cartData.items;

        await Promise.all(
          itemsToRemove.map((item) =>
            removeFromCart({ product_id: item.product_id })
          )
        );

        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }

      localStorage.removeItem("checkoutMode");
      localStorage.removeItem("buyNowItem");
      localStorage.removeItem("selectedItems");

      navigate(`/orders/${order.id}`);
    },
  });

  const buildCheckoutItems = () => {
  // BUY NOW
  if (checkoutMode === "buyNow" && buyNowItem) {
    return [
      {
        product_id: buyNowItem.product_id,
        quantity: buyNowItem.quantity,
        price: buyNowItem.price,
      },
    ];
  }

  // SELECTED ITEMS
  if (checkoutMode === "selected" && cartData?.items) {
    return cartData.items
      .filter((item) => selectedItems.includes(item.product_id))
      .map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
  }

  // FULL CART
  if (cartData?.items) {
    return cartData.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      }));
    }

    return [];
  };

  ///HANDLESUTMIT ORDER
  const handleSubmitOrder = async (e) => {
  e.preventDefault();
  setErrors({});

  const newErrors = {};

  // ===== VALIDATE =====
  if (!recipientName.trim()) {
    newErrors.recipientName = "Vui lòng nhập tên người nhận";
  } else if (!/^[A-Za-zÀ-ỹ\s]+$/.test(recipientName.trim())) {
    newErrors.recipientName =
      "Tên không được chứa số hoặc ký tự đặc biệt";
  }

  if (!recipientPhone.trim()) {
    newErrors.recipientPhone = "Vui lòng nhập số điện thoại";
  } else if (!/^\d{10}$/.test(recipientPhone.trim())) {
    newErrors.recipientPhone = "Số điện thoại không hợp lệ";
  }

  if (!shippingAddress.trim()) {
    newErrors.shippingAddress = "Vui lòng nhập địa chỉ giao hàng";
  }

  if (!shippingArea) {
    newErrors.shippingArea = "Vui lòng chọn khu vực giao hàng";
  }

  if (!paymentMethod) {
    newErrors.paymentMethod = "Vui lòng chọn phương thức thanh toán";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // ======================
  // MOMO FLOW ❗ KHÔNG TẠO ORDER
  // ======================
 if (paymentMethod === "momo") {
    try {
    const items = buildCheckoutItems();

    if (!items.length) {
      alert("Không có sản phẩm để thanh toán");
      return;
    }

    const paymentData = await createMoMoPayment({
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      shipping_address: shippingAddress,
      shipping_area: shippingArea,
      total_amount: total,
      items,
    });

    if (paymentData?.payUrl) {
      window.location.href = paymentData.payUrl;
    } else {
      alert("Không lấy được link thanh toán MoMo");
    }
   } catch (err) {
    console.error("MoMo error:", err);
    alert("Không thể khởi tạo thanh toán MoMo");
    }

    return;
  }

  const items = buildCheckoutItems();

  if (!items.length) {
    alert("Không có sản phẩm để đặt hàng");
    return;
  }

  const payload = {
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    shipping_address: shippingAddress,
    shipping_area: shippingArea,
    payment_method: "cod",
    coupon_code: appliedCoupon?.coupon?.code || null,
    items, 
  };

  createOrderMutation.mutate(payload);
  };


  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Thanh toán</h1>

      <div style={styles.layout}>
        {/* FORM */}
        <form onSubmit={handleSubmitOrder} style={styles.form} noValidate>
          <h2>Thông tin giao hàng</h2>

          <div style={styles.formGroup}>
            <label>Họ tên người nhận *</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
              style={styles.input}
            />
            {errors.recipientName && (
                <span style={styles.fieldError}>{errors.recipientName}</span>
              )}
          </div>

          <div style={styles.formGroup}>
            <label>Số điện thoại *</label>
            <input
                type="tel"
                value={recipientPhone}
                onChange={(e) =>
                  setRecipientPhone(e.target.value.replace(/\D/g, ""))
                }
                inputMode="numeric"
                style={styles.input}
              />
              {errors.recipientPhone && (
                <span style={styles.fieldError}>{errors.recipientPhone}</span>
              )}
          </div>

          <div style={styles.formGroup}>
            <label>Địa chỉ giao hàng *</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
              style={styles.textarea}
              rows={3}
            />
            {errors.shippingAddress && (
                <span style={styles.fieldError}>{errors.shippingAddress}</span>
              )}
          </div>

           <div style={styles.formGroup}>
              <label>Khu vực giao hàng *</label>

              <div>
                <label>
                  <input
                    type="radio"
                    name="shippingArea"
                    value="inner"
                    checked={shippingArea === "inner"}
                    onChange={(e) => setShippingArea(e.target.value)}
                  />
                  Trong TP.HCM
                </label>
              </div>

              <div>
                <label>
                  <input
                    type="radio"
                    name="shippingArea"
                    value="outer"
                    checked={shippingArea === "outer"}
                    onChange={(e) => setShippingArea(e.target.value)}
                  />
                  Ngoài TP.HCM
                </label>
              </div>

              {userData?.user?.role === "admin" && (
                <div>
                  <label>
                    <input
                      type="radio"
                      name="shippingArea"
                      value="store"
                      checked={shippingArea === "store"}
                      onChange={(e) => setShippingArea(e.target.value)}
                    />
                    Khách mua tại cửa hàng
                  </label>
                </div>
              )}

              {errors.shippingArea && (
                <span style={styles.fieldError}>{errors.shippingArea}</span>
              )}
            </div>


          <div style={styles.formGroup}>
            <label>Phương thức thanh toán *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={styles.input}
            >
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
              <option value="momo">MoMo</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createOrderMutation.isLoading}
            style={styles.submitButton}
          >
            {paymentMethod === "momo" ? "Thanh toán" : "Đặt hàng"}
          </button>
        </form>

        {/* SUMMARY */}
        <div style={styles.summary}>
          <h2>Tóm tắt đơn hàng</h2>

          {/* BUY NOW */}
          {checkoutMode === "buyNow" && buyNowItem && (
            <div style={styles.buyNowBox}>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <img
                  src={getImageUrl(buyNowItem.image)}
                  style={{ width: 70, height: 70 }}
                />
                <div>
                  <h3 style={{ margin: 0 }}>{buyNowItem.name}</h3>
                  <p style={{ margin: 0 }}>
                    {buyNowItem.quantity} ×{" "}
                    {new Intl.NumberFormat("vi-VN").format(buyNowItem.price)} đ
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SELECTED */}
          {checkoutMode === "selected" &&
            cartData?.items &&
            selectedItems.length > 0 && (
              <div style={{ marginBottom: 15 }}>
                {cartData.items
                  .filter((item) => selectedItems.includes(item.product_id))
                  .map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 15,
                        marginBottom: 12,
                      }}
                    >
                      <img
                        src={getImageUrl(item.image)}
                        style={{ width: 70, height: 70 }}
                      />
                      <div>
                        <h3 style={{ margin: 0 }}>{item.name}</h3>
                        <p style={{ margin: 0 }}>
                          {item.quantity} ×{" "}
                          {new Intl.NumberFormat("vi-VN").format(item.price)} đ
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

          {/* Subtotal */}
          <div style={styles.summaryRow}>
            <span>Tạm tính:</span>
            <span>{new Intl.NumberFormat("vi-VN").format(subtotal)} đ</span>
          </div>

          {/* Shipping */}
          <div style={styles.summaryRow}>
            <span>Phí ship:</span>
            <span>{new Intl.NumberFormat("vi-VN").format(shippingFee)} đ</span>
          </div>

          {/* Discount */}
          {appliedCoupon && (
            <div style={styles.summaryRow}>
              <span>
                Giảm giá
              </span>
              <span style={styles.discount}>
                -{new Intl.NumberFormat("vi-VN").format(discount)} đ
              </span>
            </div>
          )}

          {/* Coupon */}
          <div style={styles.couponSection}>
            <h3 style={styles.couponTitle}>Mã giảm giá</h3>

            {!couponsLoading &&
              couponsData?.coupons?.map((coupon) => {
                const usable = subtotal >= coupon.min_order_amount;
                const selected =
                      appliedCoupon?.coupon?.code === coupon.code ||
                      appliedCoupon?.code === coupon.code;
                return (
                 <div
                      key={coupon.id}
                      style={{
                        ...styles.couponCard,
                        ...(selected ? styles.couponCardSelected : {}),
                        ...(!usable ? styles.couponCardDisabled : {}),
                      }}
                      onClick={() => usable && handleSelectCoupon(coupon)}
                    >
                      {/* LEFT */}
                      <div style={styles.couponLeft}>
                        <div style={styles.couponCode}>{coupon.code}</div>
                        <div style={styles.couponDescription}>
                          Giảm {new Intl.NumberFormat("vi-VN").format(coupon.discount_value)} đ
                        </div>
                      </div>

                      {/* RIGHT */}
                      {selected && (
                        <div style={styles.couponRight}>
                          <span style={styles.selectedBadge}>✓ Đã chọn</span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCoupon();
                            }}
                            style={styles.removeCouponButton}
                          >
                            Gỡ mã
                          </button>
                        </div>
                      )}
                    </div>
                );
              })}

            <div style={styles.couponInputSection}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={styles.couponInput}
                placeholder="Nhập mã giảm giá"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                style={styles.couponButton}
              >
                Áp dụng
              </button>
            </div>
          </div>

          {/* TOTAL */}
          <div style={styles.totalRow}>
            <span>Tổng cộng:</span>
            <strong style={styles.totalAmount}>
              {new Intl.NumberFormat("vi-VN").format(total)} đ
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px 20px",
  },
  title: {
    fontSize: "32px",
    marginBottom: "30px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "40px",
  },
  form: {
    backgroundColor: "#f8f9fa",
    padding: "30px",
    borderRadius: "10px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "16px",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "16px",
  },
  submitButton: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#108206ff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "18px",
    cursor: "pointer",
    marginTop: "20px",
  },

  summary: {
    backgroundColor: "#f8f9fa",
    padding: "30px",
    borderRadius: "10px",
    height: "fit-content",
    position: "sticky",
    top: "20px",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },

  discount: {
    color: "#28a745",
  },

  /* ================= COUPON ================= */

  couponSection: {
    marginTop: "20px",
  },

  couponTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "15px",
  },

  couponCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    padding: "15px",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    marginBottom: "10px",
    cursor: "pointer",
    backgroundColor: "#fff",
  },

  couponCardSelected: {
    border: "2px solid #28a745", // ✅ BORDER RÕ
    backgroundColor: "#f0fff4",
  },

  couponCardDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  couponLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  couponCode: {
    fontWeight: 700,
    color: "#007bff",
    fontSize: 16,
  },

  couponDescription: {
    color: "#28a745",
    fontWeight: 600,
    fontSize: 14,
  },

  couponRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },

  selectedBadge: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },

  removeCouponButton: {
    backgroundColor: "#dc3545", // 🔴 đỏ
    color: "white",
    border: "1px solid #dc3545",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },

  couponInputSection: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },

  couponInput: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },

  couponButton: {
    padding: "10px 20px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "20px",
    borderTop: "2px solid #ddd",
    fontSize: "20px",
  },

  totalAmount: {
    fontSize: "24px",
    color: "#007bff",
  },
  fieldError: {
    color: "#dc3545",    
    fontSize: "14px",
    marginTop: "5px",
    display: "block",
  },

};


export default CheckoutPage;
