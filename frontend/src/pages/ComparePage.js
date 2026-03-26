import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProductDetail, getImageUrl, addToCart } from "../utils/api";
import { SPEC_LABELS } from "../constants/specLabels";

function ComparePage() {
  const [compareList, setCompareList] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const STORAGE_KEY = "compareList";

 
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setCompareList(saved);
  }, []);

 
  useEffect(() => {
    async function loadProducts() {
      const arr = [];
      for (let id of compareList) {
        const data = await getProductDetail(id);
        if (data?.product) arr.push(data.product);
      }
      setProducts(arr);
    }

    if (compareList.length > 0) loadProducts();
  }, [compareList]);

  /* ======================
        XÓA SẢN PHẨM
  ====================== */
  const removeProduct = (removeId) => {
    const updated = compareList.filter((id) => Number(id) !== Number(removeId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCompareList(updated);
  };

  /* ======================
        MUA NGAY
  ====================== */
/** ⭐ Mua ngay → thêm vào giỏ → đi thẳng /checkout */
  const handleBuyNow = (p) => {  
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  // luôn mua số lượng = 1 trong trang so sánh
  const buyNowItem = {
    product_id: p.id,
    name: p.name,
    image: p.image,
    price: p.price,
    quantity: 1,
  };

  localStorage.setItem("checkoutMode", "buyNow");
  localStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));

  navigate("/checkout");
};

  /* ======================
        CHỈ SO SÁNH CÙNG CATEGORY VÀ CÙNG LOẠI PHỤ KIỆN
  ====================== */
  const checkCategoryValid = () => {
  if (products.length < 2) return true;

  const baseCate = products[0].category_id;

  // 1) Kiểm tra cùng category
  const sameCategory = products.every((p) => p.category_id === baseCate);
  if (!sameCategory) return false;

  // 2) Nếu không phải phụ kiện → OK luôn
  if (baseCate !== 2) return true;

  // 3) Nếu là phụ kiện → phải cùng accessory_type
  const baseType = (products[0].accessory_type || "").trim();
  return products.every(
    (p) => (p.accessory_type || "").trim() === baseType
  );
};
const isCategoryValid = checkCategoryValid();
  /* ======================
        LẤY TẤT CẢ KEY SPEC
  ====================== */
  const allSpecs = () => {
    const specSet = new Set();

    products.forEach((p) => {
      let specs = p.specs;
      try {
        if (typeof specs === "string") specs = JSON.parse(specs);
      } catch {}

      if (specs && typeof specs === "object") {
        Object.keys(specs).forEach((k) => specSet.add(k));
      }
    });

    return [...specSet];
  };


  
  return (
    <div style={styles.page}>
      {/* ================== BACK BUTTON ================== */}
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Quay lại
      </button>

      {/* ================== TITLE ================== */}
      <h1 style={styles.pageTitle}>So sánh sản phẩm</h1>

      {/* ================== TRƯỜNG HỢP RỖNG ================== */}
      {products.length === 0 && (
        <h3 style={{ marginTop: "20px" }}>Chưa có sản phẩm để so sánh.</h3>
      )}

      {/* ================== KHÁC CATEGORY ================== */}
     {!isCategoryValid && (
      <div style={styles.errorBox}>
        <h2 style={{ color: "red" }}>⚠ Không thể so sánh sản phẩm khác loại</h2>
        <p>
          - Chỉ so sánh Điện thoại với Điện thoại.<br />
          - Chỉ so sánh Phụ kiện với Phụ kiện cùng loại (VD: dây sạc ↔ dây sạc).
        </p>
      </div>
    )}

      {/* ================== BẢNG SO SÁNH ================== */}
      {isCategoryValid && products.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `240px repeat(${products.length}, 1fr)`,
            gap: "20px",
          }}
        >
          {/* Cột thông tin sản phẩm */}
          <div></div>
          {products.map((p) => (
            <div key={p.id} style={styles.productCard}>
              <img src={getImageUrl(p.image)} style={styles.productImage} />

              <h3 style={styles.productName}>{p.name}</h3>

              <p style={styles.productPrice}>
                {new Intl.NumberFormat("vi-VN").format(p.price)} đ
              </p>

            <button
                onClick={() => handleBuyNow(p)}
                disabled={p.stock === 0}
                style={styles.buyNowButton}
              >
                Mua ngay
              </button>

              <button
                style={styles.removeButton}
                onClick={() => removeProduct(p.id)}
              >
                ❌ Xóa
              </button>
            </div>
          ))}

          {allSpecs().map((specKey) => (
            <React.Fragment key={specKey}>
              <div style={styles.specLabel}>
                 {SPEC_LABELS[specKey] || specKey.replace(/_/g, " ").toUpperCase()}
              </div>

              {products.map((p) => {
                let specs = p.specs;
                try {
                  if (typeof specs === "string") specs = JSON.parse(specs);
                } catch {}

                return (
                  <div key={p.id + specKey} style={styles.specValue}>
                    {specs?.[specKey] || "—"}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========
STYLE 
========= */
const styles = {
  page: {
    padding: "40px 20px",
  },

  backButton: {
    padding: "10px 16px",
    background: "#6c757d",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    marginBottom: "25px",
  },

  pageTitle: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "40px",
    textAlign: "center",
  },

  errorBox: {
    padding: "20px",
    background: "#ffe8e8",
    border: "1px solid #ffb3b3",
    borderRadius: "12px",
    marginBottom: "30px",
  },

  /* PRODUCT CARD */
  productCard: {
    padding: "20px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #ddd",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },

  productImage: {
    width: "140px",
    height: "140px",
    objectFit: "contain",
    marginBottom: "15px",
  },

  productName: {
    fontSize: "20px",
    fontWeight: "700",
    minHeight: "60px",
  },

  productPrice: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#e63946",
    marginTop: "10px",
    marginBottom: "10px",
  },

  buyNowButton: {
      padding: "10px 20px",
      background: "#08c01eff",
      color: "white",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      marginRight: "12px",
    
  },

  removeButton: {
      padding: "10px 20px",
      background: "#e6e6e6ff",
      color: "black",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
  },

  /* SPECS GRID */
  specLabel: {
    padding: "18px 10px",
    background: "#f1f1f1",
    fontWeight: "700",
    borderBottom: "1px solid #ddd",
    borderRadius: "8px",
  },

  specValue: {
    padding: "18px 10px",
    textAlign: "center",
    borderBottom: "1px solid #eee",
    fontSize: "16px",
  },
};

export default ComparePage;
