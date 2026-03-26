import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories, getBrands, getImageUrl } from '../utils/api';
import {  FaFilter,  FaTags,  FaMobileAlt,  FaMemory,  FaMoneyBillWave,  FaSortAmountDown,  FaPlug,} from "react-icons/fa";


function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand_id') || '');
  const [selectedRam, setSelectedRam] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortType, setSortType] = useState('');
  const [selectedAccessoryType, setSelectedAccessoryType] = useState('');
  useEffect(() => setPage(1), [searchParams.get('q')]);

  // Query params
  const queryParams = {
    page,
    limit: 12,
  };
  if (selectedCategory) queryParams.category_id = selectedCategory;
  if (selectedBrand) queryParams.brand_id = selectedBrand;
  if (selectedRam) queryParams.ram = selectedRam;
  if (selectedAccessoryType) queryParams.accessory_type = selectedAccessoryType;
  if (minPrice) queryParams.min_price = minPrice;
  if (maxPrice) queryParams.max_price = maxPrice;
  if (searchParams.get('q')) queryParams.q = searchParams.get('q');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => getProducts(queryParams)
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands
  });

  
  const filteredBrands = useMemo(() => {
    if (!brandsData || !productsData) return [];

    const brandIds = new Set(
      (productsData.products || [])
        .filter(prod => !selectedCategory || prod.category_id == selectedCategory)
        .map(prod => prod.brand_id)
    );

    return brandsData.brands.filter(brand => brandIds.has(brand.id));
  }, [brandsData, productsData, selectedCategory]);

  const handleFilterChange = () => setPage(1);


// Tạo danh sách đã sắp xếp (không mutate productsData)
const sortedProducts = useMemo(() => {
  const list = [...(productsData?.products || [])];

  if (!sortType) return list; 
  const getPrice = (p) => {
    const v = p?.price ?? 0;
    return typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]+/g, '')) || 0;
  };

  if (sortType === 'asc') {
    return list.sort((a, b) => getPrice(a) - getPrice(b));
  }

  if (sortType === 'desc') {
    return list.sort((a, b) => getPrice(b) - getPrice(a));
  }

  return list;
}, [productsData, sortType]);


  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Danh sách sản phẩm</h1>

      <div style={styles.layout}>
        
        {/* SIDEBAR */}
    
<div style={styles.filterBar}>
  <h3 style={styles.sidebarTitle}> <FaFilter /> Lọc sản phẩm </h3>
  <div style={styles.filterItem}>
    <FaMobileAlt />
    <select
    style={styles.filterSelect}
      value={selectedCategory}
      onChange={(e) => {
        const v = e.target.value;
        setSelectedCategory(v);
        setSelectedBrand("");
        setSelectedAccessoryType("");
        handleFilterChange();
      }}
    >
      <option value="">Danh mục</option>
      {categoriesData?.categories?.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  </div>

  <div style={styles.filterItem}>
    <FaTags />
    <select
      style={styles.filterSelect}
      value={selectedBrand}
      onChange={(e) => {
        setSelectedBrand(e.target.value);
        handleFilterChange();
      }}
    >
      <option value="">Thương hiệu</option>
      {filteredBrands.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  </div>

  {selectedCategory === "2" && (
    <div style={styles.filterItem}>
      <FaPlug />
      <select
      style={styles.filterSelect}
        value={selectedAccessoryType}
        onChange={(e) => {
          setSelectedAccessoryType(e.target.value);
          handleFilterChange();
        }}
      >
        <option value="">Loại phụ kiện</option>
        <option value="dây sạc">Dây sạc</option>
        <option value="sạc dự phòng">Sạc dự phòng</option>
        <option value="tai nghe">Tai nghe</option>
      </select>
    </div>
  )}

  <div style={styles.filterItem}>
    <FaMemory />
    <select
    style={styles.filterSelect}
      value={selectedRam}
      onChange={(e) => {
        setSelectedRam(e.target.value);
        handleFilterChange();
      }}
    >
      <option value="">RAM</option>
      <option value="4 GB">4 GB</option>
      <option value="6 GB">6 GB</option>
      <option value="8 GB">8 GB</option>
      <option value="12 GB">12 GB</option>
      <option value="16 GB">16 GB</option>

    </select>
  </div>

  <div style={styles.filterItem}>
    <FaMoneyBillWave />
    <select
    style={styles.filterSelect}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) {
          setMinPrice(""); setMaxPrice("");
        } else {
          const [min, max] = v.split("-");
          setMinPrice(min); setMaxPrice(max);
        }
        handleFilterChange();
      }}
    >
      <option value="">Giá</option>
      <option value="0-5000000">Dưới 5tr</option>
      <option value="5000000-10000000">5 - 10 triệu</option>
      <option value="10000000-15000000">10 - 15 triệu</option>
      <option value="15000000-20000000">15 - 20 triệu</option>
      <option value="20000000-50000000">Trên 20 triệu</option>

    </select>
  </div>

  <div style={styles.filterItem}>
    <FaSortAmountDown />
    <select
    style={styles.filterSelect}
      value={sortType}
      onChange={(e) => setSortType(e.target.value)}
    >
      <option value="">Sắp xếp</option>
      <option value="asc">Giá ↑</option>
      <option value="desc">Giá ↓</option>
    </select>
  </div>
</div>


        {/* PRODUCT LIST */}
        <main style={styles.mainContent}>

          {isLoading ? (
            <p>Đang tải sản phẩm...</p>
          ) : (
            <>
              {searchParams.get("q") && (
                <div style={styles.searchResult}>
                  <h2>Kết quả cho từ khóa: <strong>{searchParams.get("q")}</strong></h2>
                </div>
              )}

              {productsData?.products?.length === 0 ? (
                <div style={styles.emptyState}>Không tìm thấy sản phẩm.</div>
              ) : (
                <div style={styles.productsGrid}>
                  {sortedProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      style={styles.productCard}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.productCardHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.productCard)}
                    >
                      <div style={styles.productImageBox}>
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          style={styles.productImage}
                          onError={(e) => (e.target.src = '/placeholder.jpg')}
                        />
                      </div>

                      <h3 style={styles.productName}>{product.name}</h3>
                      <p style={styles.productPrice}>
                        {new Intl.NumberFormat("vi-VN").format(product.price)} đ
                      </p>
                    </Link>
                  ))}

                </div>
              )}

              {/* Pagination */}
              {productsData?.pagination?.totalPages > 1 && (
                <div style={styles.pagination}>
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} style={styles.paginationButton}>◀</button>
                  <span style={styles.paginationText}>{page} / {productsData.pagination.totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={page >= productsData.pagination.totalPages} style={styles.paginationButton}>▶</button>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}

/* ============================
      ⭐ BEAUTIFUL UI STYLES
============================= */
const styles = {
  page: {
    padding: "50px 25px",
    background: "#f8f9fa",
  },

  title: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "35px",
    textAlign: "center",
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  layout: {
    display: "block",
    
  },

  /* ⭐ SIDEBAR */
  sidebar: {
    background: "#fff",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  border: "1px solid #e5e7eb",
  position: "sticky",
  top: "100px",
  },

  sidebarTitle: {
     display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "18px",
  fontWeight: "700",
  marginBottom: "16px",
  color: "#1d4ed8",
  },

  filterGroup: {
    marginBottom: "22px",
  },

  label: {
    display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "8px",
  color: "#374151",
  },

  select: {
     width: "100%",
  height: "38px",
  padding: "0 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none",
  },

  /* ⭐ PRODUCT GRID */
  mainContent: {},

  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "28px",
  },

  /* ⭐ PRODUCT CARD */
  productCard: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e6e6e6",
    textDecoration: "none",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    transition: "0.3s",
    paddingBottom: "15px",
    transform: "translateY(0)",
  },

  productCardHover: {
    transform: "translateY(-8px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  },

  productImageBox: {
    width: "100%",
    height: "250px",
    background: "#f2f4f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  productImage: {
    width: "72%",
    height: "72%",
    objectFit: "contain",
    transition: "0.3s ease",
  },

  productName: {
    padding: "14px",
    fontSize: "17px",
    fontWeight: "600",
    minHeight: "50px",
    color: "#222",
  },

  productPrice: {
    padding: "0 14px",
    fontSize: "19px",
    fontWeight: "700",
    color: "#e60023",
  },

  /* ⭐ EMPTY STATE */
  emptyState: {
    padding: "50px",
    textAlign: "center",
    color: "#777",
    fontSize: "18px",
  },

  /* ⭐ PAGINATION */
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: "35px",
    gap: "14px",
  },

  paginationButton: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "0.2s",
  },

  paginationText: {
    fontSize: "17px",
    fontWeight: "700",
  },
  filterBox: {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "14px",
},
filterBar: {
    display: "flex",
  alignItems: "center",
  justifyContent: "space-between", // ⭐ QUAN TRỌNG
  gap: "12px",
  padding: "14px 18px",
  marginBottom: "30px",
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
},

filterItem: {
   flex: 1,                 
  minWidth: "140px",       
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "#f9fafb",
},

filterItemSelect: {
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "14px",
  cursor: "pointer",
},
filterSelect: {
  flex: 1,              
  height: "36px",
  border: "none",
  background: "transparent",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none",
},
};


export default ProductsPage;
