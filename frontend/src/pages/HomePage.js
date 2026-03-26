import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories, getImageUrl } from "../utils/api";
import {  FaMobileAlt,  FaHeadphones,FaThLarge} from "react-icons/fa";

function HomePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Banner lớn chạy
const bigBanners = [
  "/images/bigBanner/banner1.jpg",
  "/images/bigBanner/banner2.jpg",
  "/images/bigBanner/banner3.webp",
];

const [currentBigBanner, setCurrentBigBanner] = useState(0);

// Banner nhỏ đứng yên
const smallBanners = [
  {
    image: "/images/banner-small-1.png",
    link: "/products?category=phone",
  },
  {
    image: "/images/banner-small-2.webp",
    link: "/products?category=accessory",
  },
];

// Auto chạy banner lớn
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentBigBanner(
      (prev) => (prev + 1) % bigBanners.length
    );
  }, 3000);

  return () => clearInterval(timer);
}, []);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => getProducts({ limit: 8, page: 1 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const categoryIcons = {
     "Tất cả": <FaThLarge size={36} />,
  "Điện thoại": <FaMobileAlt size={36} />,
  "Phụ kiện": <FaHeadphones size={36} />,};

  return (
    <div>
     
    <section style={styles.bannerSection}>
  <div style={styles.bannerLayout}>
    {/* BANNER LỚN – CHẠY */}
    <div style={styles.bannerMain}>
      <img
        src={bigBanners[currentBigBanner]}
        alt="Big Banner"
        style={styles.bannerImg}
      />

      <div style={styles.bannerDots}>
        {bigBanners.map((_, i) => (
          <span
            key={i}
            onClick={() => setCurrentBigBanner(i)}
            style={{
              ...styles.bannerDot,
              opacity: currentBigBanner === i ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>

    {/* BANNER NHỎ – ĐỨNG YÊN */}
    <div style={styles.bannerSmallWrapper}>
      {smallBanners.map((b, i) => (
        <Link key={i} to={b.link} style={styles.bannerSmall}>
          <img
            src={b.image}
            alt="Small Banner"
            style={styles.bannerImg}
          />
        </Link>
      ))}
    </div>
  </div>
</section>


      {categoriesData && (
        <section style={styles.section}>
          <div className="container">
            <div style={styles.categoriesGrid}>
            <Link
                to="/products"
                style={styles.categoryCard}
              >
                <div style={styles.categoryContent}>
                  <div style={styles.categoryIcon}>
                    {categoryIcons["Tất cả"]}
                  </div>

                  <div style={styles.categoryText}>
                    <h3 style={styles.categoryTitle}>Tất cả</h3>
                    <p style={styles.categoryCount}>sản phẩm</p>
                  </div>
                </div>
              </Link>
              {categoriesData.categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category_id=${category.id}`}
                  style={styles.categoryCard}
                >
                  <div style={styles.categoryContent}>
                    <div style={styles.categoryIcon}>
                      {categoryIcons[category.name] || <FaMobileAlt size={28} />}
                    </div>

                    <div style={styles.categoryText}>
                      <h3 style={styles.categoryTitle}>{category.name}</h3>
                      <p style={styles.categoryCount}>
                        {category.product_count} sản phẩm
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      <section style={styles.section}>
        <div className="container">
          <h2 style={styles.sectionTitle}>Sản phẩm nổi bật</h2>

          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            <div style={styles.productsGrid}>
              {productsData?.products?.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  style={styles.productCard}
                  className="product-card-hover"
                >
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    style={styles.productImage}
                    onError={(e) => (e.target.src = "/placeholder.jpg")}
                  />
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productPrice}>
                    {new Intl.NumberFormat("vi-VN").format(product.price)} đ
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


const styles = {
  categoryIcon: {
   width: "40px",         
  height: "40px",
  display: "flex",
  alignItems: "center",   
  justifyContent: "center",
  color: "#e14b0bff",
  flexShrink: 0,
},

  topSection: {
    width: "100%",
    padding: "50px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(4px)",
    borderBottom: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    borderRadius: "0 0 20px 20px",
    flexWrap: "wrap",
    gap: "25px",
  },

  topLeft: { flex: 1 },

  topTitle: {
    fontSize: "42px",
    fontWeight: "900",
    background: "linear-gradient(90deg,#4f46e5,#3b82f6,#6366f1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  topTitleHighlight: {
    background: "linear-gradient(90deg,#14b8a6,#06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  topRight: {
    display: "flex",
    gap: "15px",
  },

  ctaButtonPrimary: {
    padding: "12px 35px",
    background: "#218233",
    color: "white",
    borderRadius: "30px",
    fontWeight: "700",
    textDecoration: "none",
  },

  ctaButtonSecondary: {
    padding: "12px 35px",
    border: "2px solid #05a134",
    background: "white",
    color: "#05a134",
    borderRadius: "30px",
    fontWeight: "700",
    textDecoration: "none",
  },
  sliderWrapper: {
    width: "100%",
    height: "450px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  sliderBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    filter: "blur(10px) brightness(1)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.05)",
  },

  sliderImage: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    objectFit: "contain",
  },

  arrowLeft: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    background: "rgba(0,0,0,0.4)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "45px",
    height: "45px",
    fontSize: "28px",
    cursor: "pointer",
  },

  arrowRight: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    background: "rgba(0,0,0,0.4)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "45px",
    height: "45px",
    fontSize: "28px",
    cursor: "pointer",
  },

  dotsContainer: {
    position: "absolute",
    bottom: "15px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    zIndex: 3,
  },

  dot: {
    width: "12px",
    height: "12px",
    background: "white",
    borderRadius: "50%",
    cursor: "pointer",
  },

  section: {
    padding: "30px 20px",
  },

  sectionTitle: {
    fontSize: "32px",
    marginBottom: "30px",
    textAlign: "center",
  },

  categoriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    justifyContent: "center",             
    gap: "20px",
    padding: "10px",
  },

  categoryCardHover: {
    transform: "translateY(-5px)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
  },

  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "25px",
  },

  productCard: {
    background: "white",
    borderRadius: "15px",
    border: "1px solid #e5e5e5",
    overflow: "hidden",
    textDecoration: "none",
    color: "#333",
    transition: "0.3s",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  },

  productCardHover: {
    transform: "translateY(-6px)",
    boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
  },

  productImage: {
    width: "100%",
    height: "220px",
    objectFit: "contain",
    padding: "10px",
    backgroundColor: "#f9f9f9",
  },

  productName: {
    padding: "15px",
    fontSize: "18px",
  },

  productPrice: {
    padding: "0 15px 15px",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#b70c0cff",
  },
  bannerSection: {
  padding: "20px",
},

bannerLayout: {
  display: "grid",
  gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "2fr 1fr",
  gap: "20px",
  maxWidth: "1200px",
  margin: "0 auto",
},

bannerSmallWrapper: {
  display: "grid",
  gridTemplateRows: window.innerWidth <= 768 ? "1fr" : "1fr 1fr",
  gap: "20px",
},

bannerSmall: {
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  height: window.innerWidth <= 768 ? "160px" : "150px",
},

bannerImg: {
  width: "100%",
  height: "100%",
   objectFit: "cover", 
  backgroundColor: "#ffffffff",
  display: "block",
},

bannerArrowLeft: {
  position: "absolute",
  left: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.4)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  cursor: "pointer",
},

bannerArrowRight: {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.4)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  cursor: "pointer",
},

bannerDots: {
  position: "absolute",
  bottom: "10px",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  gap: "8px",
},

bannerDot: {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#fff",
  cursor: "pointer",
},
bannerMain: {
  position: "relative",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
  height: window.innerWidth <= 768 ? "200px" : "320px",
},
categoryCard: {
   padding: "14px 18px",
  background: "white",
  borderRadius: "12px",
  textDecoration: "none",
  color: "#333",
  border: "1px solid #e0e0e0",
  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",   
},

categoryText: {
  display: "flex",
  flexDirection: "column",
},

categoryTitle: {
  fontSize: "16px",
  fontWeight: "600",
  margin: 0,
},

categoryCount: {
  fontSize: "13px",
  color: "#6b7280",
  margin: 0,
},
categoryContent: {
  display: "flex",
  alignItems: "center",     // 🔥 icon + chữ giữa nhau
  gap: "14px",
},
};

export default HomePage;
