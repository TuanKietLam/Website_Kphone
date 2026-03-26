import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getProductDetail, getProducts, getImageUrl } from "../utils/api";

function CompareBar() {
  const [compareList, setCompareList] = useState([]);
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const STORAGE_KEY = "compareList";
  const [prevPath, setPrevPath] = useState("");
  const [closed, setClosed] = useState(false);

  // ⚡ RESET KHI F5
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCompareList([]);
    setSuggestions([]);
    setClosed(false);
    window.dispatchEvent(new Event("compareListUpdated"));
  }, []);

  // Lưu path trước đó
  useEffect(() => {
    setPrevPath(location.pathname);
  }, [location.pathname]);

  // ⚡ RESET khi rời trang /compare
  useEffect(() => {
    if (prevPath === "/compare" && location.pathname !== "/compare") {
      localStorage.removeItem(STORAGE_KEY);
      setCompareList([]);
      setSuggestions([]);
      window.dispatchEvent(new Event("compareListUpdated"));
    }
  }, [location.pathname, prevPath]);


  // Lắng nghe cập nhật compareList
  useEffect(() => {
    const updateList = () => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setCompareList(stored);

      if (stored.length > 0) setClosed(false);
    };

    updateList();
    window.addEventListener("compareListUpdated", updateList);

    return () => window.removeEventListener("compareListUpdated", updateList);
  }, []);

  // Load chi tiết sản phẩm trong bar
  useEffect(() => {
    async function fetchData() {
      const result = [];
      for (let id of compareList) {
        const data = await getProductDetail(id);
        if (data?.product) result.push(data.product);
      }
      setProducts(result);
    }

    if (compareList.length > 0) fetchData();
    else setProducts([]);
  }, [compareList]);


// ⚡ GỢI Ý SẢN PHẨM
useEffect(() => {
  async function loadSuggestions() {
    if (products.length === 0) {
      setSuggestions([]);
      return;
    }

    const base = products[0]; 
    const all = await getProducts();

    // Nếu là điện thoại
    if (base.category_id !== 2) {
      const min = base.price - 5000000;
      const max = base.price + 5000000;

      const filtered = all.products
        .filter(
          (p) =>
            p.id !== base.id &&
            p.category_id === base.category_id &&
            p.price >= min &&
            p.price <= max
        )
        .slice(0, 5);

      return setSuggestions(filtered);
    }

    // ⭐ Nếu là phụ kiện → gợi ý theo loại phụ kiện
    const filteredAccessory = all.products
      .filter(
        (p) =>
          p.id !== base.id &&
          p.category_id === 2 &&
          (p.accessory_type || "").trim() === (base.accessory_type || "").trim()
      )
      .slice(0, 5);

    setSuggestions(filteredAccessory);
  }

  loadSuggestions();
}, [products]);



  // ⚡ Nút đóng → reset thanh bar hoàn toàn
  const closeBar = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCompareList([]);
    setSuggestions([]);
    setClosed(true);
  };


  // Nếu đóng thì ẩn bar
  if (closed) return null;

  // Nếu không có sản phẩm thì ẩn bar
  if (products.length === 0) return null;


  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        padding: "14px",
        boxShadow: "0 -4px 15px rgba(0,0,0,0.15)",
        zIndex: 9999,
      }}
    >
      {/* Nút đóng */}
      <button
        onClick={closeBar}
        style={{
          position: "absolute",
          top: "-35px",
          right: "20px",
          padding: "6px 12px",
          borderRadius: "20px",
          border: "none",
          background: "#333",
          color: "white",
          cursor: "pointer",
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        ✖ Đóng
      </button>

      {/* Danh sách sản phẩm đang so sánh */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: "260px",
              background: "#fafafa",
            }}
          >
            <img
              src={getImageUrl(product.image)}
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />

            <div style={{ fontSize: "14px", fontWeight: "600" }}>
              {product.name}
            </div>

            <button
              onClick={() => {
                const updated = compareList.filter((x) => x !== product.id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                setCompareList(updated);
                window.dispatchEvent(new Event("compareListUpdated"));
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: "#444",
                fontWeight: "bold",
                marginLeft: "auto",
              }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={() => navigate("/compare")}
          disabled={products.length < 2}
          style={{
            marginLeft: "auto",
            padding: "14px 22px",
            borderRadius: "10px",
            border: "none",
            background: products.length < 2 ? "#ccc" : "red",
            color: "white",
            fontWeight: "700",
            cursor: products.length < 2 ? "not-allowed" : "pointer",
            fontSize: "17px",
          }}
        >
          So sánh
        </button>
      </div>

      {/* ===================== GỢI Ý ======================= */}
      {suggestions.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            padding: "6px",
            background: "#efefef",
            borderRadius: "6px",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
          }}
        >
          {suggestions.map((item) => (
            <div
              key={item.id}
              style={{
                minWidth: "90px",
                background: "white",
                padding: "5px",
                borderRadius: "6px",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={getImageUrl(item.image)}
                style={{
                  width: "45px",
                  height: "45px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  marginBottom: "4px",
                }}
              />

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: "3px",
                }}
              >
                {item.name}
              </div>

              <div
                style={{
                  color: "green",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
              >
                {new Intl.NumberFormat("vi-VN").format(item.price)} đ
              </div>

              <button
                style={{
                  padding: "3px 5px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "10px",
                }}
                onClick={() => {
                  const updated = [...compareList, item.id];
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                  window.dispatchEvent(new Event("compareListUpdated"));
                }}
              >
                + So sánh
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompareBar;
