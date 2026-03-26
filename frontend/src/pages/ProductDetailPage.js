

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SPEC_LABELS } from "../constants/specLabels";
import { getProducts } from "../utils/api";
import {  getProductDetail,  addToCart,  createReview,  createReviewReply,  getImageUrl,} from '../utils/api';
import {  FaStar,  FaShoppingCart,  FaBolt,  FaBalanceScale,  FaCheckCircle,  FaTimesCircle,  FaBoxOpen,  FaTags,  FaInfoCircle,  
  FaRegCommentDots,  FaReply,  FaChevronLeft,  FaChevronRight,} from "react-icons/fa";

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [replyForms, setReplyForms] = useState({}); 
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [relatedPage, setRelatedPage] = useState(1);
  const relatedLimit = 5;

  const { data, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductDetail(productId),
  });

  const product = data?.product;
  const reviews = data?.reviews || [];

const { data: relatedData } = useQuery({
  queryKey: ["related-products", product?.id],
  enabled: !!product, 
  queryFn: () => {
    if (product.category_id === 2 && product.accessory_type) {
      return getProducts({
        limit: 10,
        accessory_type: product.accessory_type,
        exclude_id: product.id,
      });
    }

    // ⭐ Còn lại → gợi ý theo category như cũ
    return getProducts({
      limit: 10,
      category_id: product.category_id,
      exclude_id: product.id,
    });
  },
});

const relatedProducts = relatedData?.products || [];
const totalRelatedPages = Math.ceil(relatedProducts.length / relatedLimit);

const startIndex = (relatedPage - 1) * relatedLimit;
const endIndex = startIndex + relatedLimit;

const visibleRelated = relatedProducts.slice(startIndex, endIndex);

  const getProductImages = () => {
    if (product?.images_list && product.images_list.length > 0) {
      return product.images_list.map((img) => img.image_url);
    }

    if (product?.images) {
      try {
        const imagesParsed =
          typeof product.images === 'string'
            ? JSON.parse(product.images)
            : product.images;
        if (Array.isArray(imagesParsed) && imagesParsed.length > 0) {
          return imagesParsed;
        }
      } catch (e) {
        console.error('Error parsing product.images', e);
      }
    }

    if (product?.image) {
      return [product.image];
    }

    return [];
  };

  const productImages = getProductImages();
  const currentImage =
    productImages[selectedImageIndex] ||
    productImages[0] ||
    product?.image ||
    null;

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId]);

  const addToCartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('Đã thêm vào giỏ hàng!');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      alert('Đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
    },

    onError: (err) => {
      const message = err.response?.data?.error;
      if (message) {
        alert(message);
      } else {
        alert('Không thể gửi đánh giá');
      }
    },
  });


  const createReplyMutation = useMutation({
    mutationFn: ({ reviewId, comment }) => createReviewReply(reviewId, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    addToCartMutation.mutate({
      product_id: parseInt(productId),
      quantity,
    });
  };

  const handleBuyNow = () => {
  if (!user) {
    navigate("/login");
    return;
  }

  const buyNowItem = {
    product_id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    quantity: quantity,
  };

  localStorage.setItem("checkoutMode", "buyNow");
  localStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));

  navigate("/checkout");
};


const handleAddToCompare = () => {
  const compareList = JSON.parse(localStorage.getItem("compareList") || "[]");
  if (compareList.length === 1) {
    getProductDetail(compareList[0]).then((data) => {
      if (data.product.category_id !== product.category_id) {
        alert("Không thể so sánh điện thoại với phụ kiện hoặc khác loại!");
        return;
      }
    });
  }

  if (compareList.length >= 2) {
    alert("Bạn chỉ được so sánh tối đa 2 sản phẩm!");
    return;
  }

  if (compareList.includes(productId)) {
    alert("Sản phẩm đã có trong danh sách so sánh!");
    return;
  }

  const updated = [...compareList, productId];
  localStorage.setItem("compareList", JSON.stringify(updated));

  window.dispatchEvent(new Event("compareListUpdated"));

  alert("Đã thêm sản phẩm vào danh sách so sánh!");

  if (updated.length === 2) navigate("/compare");
};
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    createReviewMutation.mutate({
      product_id: parseInt(productId),
      rating: reviewRating,
      comment: reviewComment,
    });
  };


  const toggleReplyForm = (reviewId) => {
    setReplyForms((prev) => ({
      ...prev,
      [reviewId]: {
        show: !prev[reviewId]?.show,
        comment: prev[reviewId]?.comment || '',
      },
    }));
  };

  
  const handleSubmitReply = (reviewId) => {
    const form = replyForms[reviewId];
    if (!form || !form.comment.trim()) {
      alert('Vui lòng nhập nội dung trả lời');
      return;
    }

    createReplyMutation.mutate({
      reviewId,
      comment: form.comment,
    });

    setReplyForms((prev) => ({
      ...prev,
      [reviewId]: { show: false, comment: '' },
    }));
  };

  if (isLoading) {
    return <div className="container">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return <div className="container">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div className="container" style={styles.page}>
      {/* ================== TOP SECTION: ẢNH + INFO ================== */}
      <div style={styles.topLayout}>
        {/* Ảnh sản phẩm */}
        <div style={styles.imageSection}>
          <div style={styles.mainImageWrapper}>
            {currentImage ? (
              <img
                key={currentImage} 
                src={getImageUrl(currentImage)}
                alt={product.name}
                style={{
                  ...styles.mainImage,
                  opacity: imageLoaded ? 1 : 0,
                  transition: "opacity 0.25s ease"
                }}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.target.src = "/placeholder.jpg";
                  setImageLoaded(true);
                }}
              />
            ) : (
              <div style={styles.placeholderBox}>Không có ảnh</div>
            )}
          </div>

          {/* Thumbnail */}
          {productImages.length > 1 && (
            <div style={styles.thumbnailList}>
              {productImages.map((imageUrl, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.thumbnailItem,
                    ...(index === selectedImageIndex
                      ? styles.thumbnailActive
                      : {}),
                  }}
                  onClick={() => {
                  setImageLoaded(false);   
                  setSelectedImageIndex(index);
                }}
                >
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={`${product.name} - Ảnh ${index + 1}`}
                    style={styles.thumbnail}
                    onError={(e) => {
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm */}
        <div style={styles.infoSection}>
          <h1 style={styles.productName}>{product.name}</h1>
          <p style={styles.productPrice}>
            <FaTags style={{ marginRight: 8 }} />
             {new Intl.NumberFormat("vi-VN").format(product.price)} đ
          </p>

          {/* Nếu là phụ kiện thì hiển thị loại phụ kiện */}
            {product.category_id === 2 && product.accessory_type && (
              <p style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px", color: "#444" }}>
                Loại phụ kiện: <span style={{ color: "#0d6efd" }}>{product.accessory_type}</span>
              </p>
            )}
          {/* Rating tổng */}
          {data?.averageRating > 0 && (
            <div style={styles.rating}>
              <FaStar color="#f4a261" />{" "}
                {data.averageRating.toFixed(1)} ({data.reviewCount} đánh giá)
            </div>
          )}

          {/* Tồn kho */}
          <p
            style={{
                ...styles.stock,
                color: product.stock > 0 ? "green" : "red",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {product.stock > 0 ? (
                <>
                  <FaCheckCircle /> Còn hàng ({product.stock})
                </>
              ) : (
                <>
                  <FaTimesCircle /> Hết hàng
                </>
              )}
          </p>

          {/* Số lượng */}
          <div style={styles.quantitySection}>
            <label>Số lượng:</label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={styles.quantityInput}
            />
          </div>

          {/* ⭐ Hàng nút: Thêm + Mua ngay */}
          <div style={styles.buttonRow}>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              style={styles.addToCartButton}
            >
              <FaShoppingCart style={{ marginRight: 8 }} />
                Thêm vào giỏ
            </button>

            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              style={styles.buyNowButton}
            >
              <FaBolt style={{ marginRight: 8 }} />
              Mua ngay
            </button>

            <button
              onClick={handleAddToCompare}
              style={styles.compareButton}
            >
             <FaBalanceScale style={{ marginRight: 8 }} />
              So sánh
            </button>
          </div>

          {/* Thông số kỹ thuật (từ JSON specs) */}
          {product.specs && (
            <div style={styles.specs}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}> <FaInfoCircle /> Thông số kỹ thuật</h3>
              <div style={styles.specsTable}>
                {(() => {
                  try {
                    const specs =
                      typeof product.specs === 'string'
                        ? JSON.parse(product.specs)
                        : product.specs;
                    return Object.entries(specs).map(([key, value]) => {
                      const label = SPEC_LABELS[key] || key.replace(/_/g, " ");

                      return (
                        <div key={key} style={styles.specRow}>
                          <strong style={styles.specLabel}>{label}:</strong>
                          <span style={styles.specValue}>{value}</span>
                        </div>
                      );
                    });
                  } catch (e) {
                    return <p>{product.specs}</p>;
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================== MÔ TẢ ================== */}
      <section style={styles.section}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}> 
          <FaBoxOpen /> Mô tả sản phẩm</h2>
        <p style={styles.description}>
          {product.description || 'Chưa có mô tả'}
        </p>
      </section>

      {/* ================== ĐÁNH GIÁ ================== */}
      <section style={styles.section}>
        <h2 style={styles.reviewTitle}><FaRegCommentDots /> Đánh giá sản phẩm</h2>

        {/* Nút mở form review */}
        {user && (
       <button
          style={styles.writeReviewButton}
          onClick={() => setShowReviewForm(!showReviewForm)}
        >
          {showReviewForm ? 'Đóng form đánh giá' : 'Viết đánh giá'}
        </button>
        )}

        {/* Form đánh giá */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} style={styles.reviewForm}>
            <div style={styles.formGroup}>
              <label>Điểm đánh giá:</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
                style={styles.select}
              >
                {[5, 4, 3, 2, 1].map((star) => (
                  <option key={star} value={star}>
                    {star} sao
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label>Nhận xét:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={styles.textarea}
              />
            </div>
            <button type="submit" style={styles.submitButton}>
              Gửi đánh giá
            </button>
          </form>
        )}

        {/* Danh sách review */}
        <div style={styles.reviewsList}>
          {reviews.length === 0 ? (
            <p>Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} style={styles.reviewItem}>
                <div style={styles.reviewHeader}>
                  <div>
                    <strong>{review.user_name}</strong>
                    <span style={styles.reviewRating}>
                      {' '}
                      • {review.rating}⭐
                    </span>
                  </div>
                  <span style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p style={styles.reviewComment}>{review.comment}</p>

                {/* Nút trả lời nếu user là admin hoặc đã login (tuỳ bạn giữ logic này hay không) */}
                {user && (
                  <button
                    style={styles.replyButton}
                    onClick={() => toggleReplyForm(review.id)}
                  >
                    {replyForms[review.id]?.show ? 'Đóng trả lời' : 'Trả lời'}
                  </button>
                )}

                {/* Form trả lời */}
                {replyForms[review.id]?.show && (
                  <div style={styles.replyForm}>
                    <textarea
                      style={styles.replyTextarea}
                      value={replyForms[review.id]?.comment || ''}
                      onChange={(e) =>
                        setReplyForms((prev) => ({
                          ...prev,
                          [review.id]: {
                            ...(prev[review.id] || { show: true }),
                            comment: e.target.value,
                          },
                        }))
                      }
                    />
                    <button
                      style={styles.replySubmitButton}
                      type="button"
                      onClick={() => handleSubmitReply(review.id)}
                    >
                      Gửi trả lời
                    </button>
                  </div>
                )}

                {/* Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div style={styles.repliesList}>
                    {review.replies.map((reply) => (
                      <div key={reply.id} style={styles.replyItem}>
                        <div style={styles.replyHeader}>
                          <div>
                            <strong>{reply.user_name}</strong>
                            {reply.user_role === 'admin' && (
                              <span style={styles.adminBadge}> • Admin</span>
                            )}
                          </div>
                          <span style={styles.replyDate}>
                            {new Date(reply.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p style={styles.replyComment}>{reply.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================== SẢN PHẨM TƯƠNG TỰ ================== */}
        {relatedProducts.length > 0 && (
          <section style={styles.relatedWrapper}>
            <h2 style={{ marginBottom: 20 }}>Sản phẩm tương tự</h2>

            <div style={styles.relatedGrid}>
              {visibleRelated.map((item) => (
                <div
                  key={item.id}
                  style={styles.relatedCard}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.relatedCardHover)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.relatedCard)}
                  onClick={() => navigate(`/products/${item.id}`)}
                >
                  <img
                    src={getImageUrl(item.image)}
                    style={styles.relatedImage}
                    onError={(e) => (e.target.src = "/placeholder.jpg")}
                  />
                  <p style={styles.relatedName}>{item.name}</p>
                  <p style={styles.relatedPrice}>
                    {new Intl.NumberFormat("vi-VN").format(item.price)} đ
                  </p>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            {totalRelatedPages > 1 && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  disabled={relatedPage === 1}
                  onClick={() => setRelatedPage((p) => p - 1)}
                  style={styles.relatedPageBtn}
                >
                  ◀
                </button>

                <span style={{ margin: "0 12px", fontWeight: 600 }}>
                  {relatedPage} / {totalRelatedPages}
                </span>

                <button
                  disabled={relatedPage === totalRelatedPages}
                  onClick={() => setRelatedPage((p) => p + 1)}
                  style={styles.relatedPageBtn}
                >
                  ▶
                </button>
              </div>
            )}
          </section>
        )}
    </div>
  );
}

/* ============================
      STYLES INLINE
=========================== */
const styles = {
  page: {
    padding: "40px 0",
  },

  topLayout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1.5fr",
    gap: "40px",
    marginBottom: "50px",
  },

  /* IMAGE SECTION */
  mainImageWrapper: {
    backgroundColor: "#f5f7fa",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  mainImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
  },

  thumbnailList: {
    display: "flex",
    gap: "12px",
    marginTop: "15px",
    flexWrap: "wrap",
  },
  thumbnailItem: {
     width: "75px",
    height: "75px",
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "0.3s",

    /* FIX border */
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: "#0d6efd",
    boxShadow: "0 0 0 3px rgba(13,110,253,0.25)",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  /* INFO SECTION */
  productName: {
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "12px",
    color: "#202020",
  },
  productPrice: {
    fontSize: "30px",
    color: "#e63946",
    fontWeight: "700",
    marginBottom: "15px",
  },
  rating: {
    marginBottom: "15px",
    color: "#f4a261",
    fontWeight: "600",
    fontSize: "18px",
  },
  stock: {
    marginBottom: "25px",
    fontWeight: "600",
    fontSize: "16px",
  },

  quantitySection: {
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "17px",
  },
  quantityInput: {
    width: "90px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cfcfcf",
    fontSize: "16px",
  },

  buttonRow: {
    display: "flex",
    gap: "15px",
    marginBottom: "35px",
    flexWrap: "wrap",
  },

  addToCartButton: {
    padding: "14px 28px",
    backgroundColor: "#058420ff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  },

  buyNowButton: {
    padding: "14px 28px",
    backgroundColor: "#ff3b30",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 4px 10px rgba(255,59,48,0.25)",
  },

  /* SPECS */
  specs: {
    marginTop: "25px",
    backgroundColor: "#f8f9fa",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  },

  specsTable: {
    marginTop: "15px",
    borderTop: "2px solid #e1e1e1",
  },
  specRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e5e5",
  },

  specLabel: {
    width: "180px",
    fontWeight: "700",
    color: "#333",
  },

  specValue: {
    flex: 1,
    color: "#444",
    fontWeight: "500",
  },

  /* MÔ TẢ */
  description: {
    fontSize: "22px",
    lineHeight: "1.8",
    color: "#333",
    padding: "10px 0",
    marginTop: "15px",
    marginBottom: "20px",
  },

  /* ========== REVIEW ========== */
  reviewForm: {
    marginBottom: "30px",
    padding: "25px",
    backgroundColor: "#f0f4ff",
    borderRadius: "14px",
    border: "1px solid #d0ddff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },

  formGroup: {
    marginBottom: "18px",
  },
  infoSection:{
    marginBottom: "55px",
  },

  /* ⭐⭐ SAO ĐÁNH GIÁ (ĐẸP NHẤT) ⭐⭐ */
  starContainer: {
    display: "flex",
    gap: "6px",
    marginBottom: "10px",
    fontSize: "30px",
    cursor: "pointer",
    color: "#ffd166",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #bfc7d8",
    resize: "vertical",
    fontSize: "16px",
    lineHeight: "1.6",
  },

  submitButton: {
    padding: "10px 18px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "5px",
    fontWeight: "600",
  },

  /* REVIEW LIST */
  writeReviewButton: {
  padding: "10px 10px",
  background: "linear-gradient(135deg, #0d6efd, #4a8dff)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: "700",
  marginBottom: "30px",
  boxShadow: "0 6px 15px rgba(13,110,253,0.3)",
  transition: "0.25s ease",
},
writeReviewButtonHover: {
  transform: "translateY(-3px)",
  boxShadow: "0 10px 25px rgba(13,110,253,0.45)",
},
reviewTitle: {
  marginBottom: "25px", // ⭐ tạo khoảng cách giữa H2 và nút viết đánh giá
},
  reviewItem: {
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid #e3e3e3",
    marginBottom: "18px",
    backgroundColor: "white",
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
  },

  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },

  reviewComment: {
    fontSize: "16px",
    lineHeight: "1.7",
    marginTop: "8px",
    marginBottom: "10px",
  },

  replyButton: {
    padding: "6px 12px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "8px",
  },

  replyForm: {
    padding: "15px",
    backgroundColor: "#f7f9fc",
    borderRadius: "10px",
    border: "1px solid #d6d9de",
    marginTop: "15px",
  },

  replyTextarea: {
    width: "100%",
    padding: "12px",
    minHeight: "80px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  replySubmitButton: {
    marginTop: "10px",
    padding: "8px 14px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },

  repliesList: {
    marginTop: "15px",
    paddingLeft: "20px",
    borderLeft: "3px solid #e5e5e5",
  },
  compareButton: {
  padding: "14px 28px",
  backgroundColor: "#6f42c1",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "17px",
  cursor: "pointer",
  fontWeight: "600",
  boxShadow: "0 4px 10px rgba(111,66,193,0.25)",
},
//sản phẩm tt
relatedGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

relatedCard: {
 padding: "12px",
  background: "white",
  borderRadius: "14px",
  border: "1px solid #ddd",
  cursor: "pointer",
  textAlign: "center",
  transition: "0.25s ease",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
},
relatedCardHover: {
  transform: "translateY(-5px)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
},

relatedImage: {
  width: "100%",
  height: "160px",
  objectFit: "contain",
  marginBottom: "10px",
},

relatedName: {
  fontSize: "15px",
  fontWeight: "600",
  minHeight: "40px",
  color: "#222",
},

relatedPrice: {
  fontSize: "16px",
  fontWeight: "700",
  color: "#e60023",
  marginTop: "6px",
},
relatedPageBtn: {
  padding: "8px 14px",
  border: "1px solid #ccc",
  background: "white",
  borderRadius: "8px",
  cursor: "pointer",
  margin: "0 5px",
},
relatedWrapper: {
  padding: "25px",
  borderRadius: "16px",
  border: "1px solid #e0e0e0",
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  background: "white",
  marginTop: "20px",
},
};



export default ProductDetailPage;
