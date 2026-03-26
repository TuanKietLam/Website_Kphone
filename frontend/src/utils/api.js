import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api/v1';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5002';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/placeholder.jpg'; 
  }
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) {
    return `${BACKEND_URL}${imagePath}`;
  }
  return `${BACKEND_URL}/${imagePath}`;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url;

          if (error.response?.status === 401 && !url.includes('/chatbox') && !url.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }

        return Promise.reject(error);
      }
    );

// ==================== AUTH APIs ====================


export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// ==================== USER APIs ====================


export const getUserProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await api.put('/users/me', userData);
  return response.data;
};


export const changePassword = async (passwordData) => {
  const response = await api.post('/users/change-password', passwordData);
  return response.data;
};


export const getMyReviews = async () => {
  const response = await api.get('/users/me/reviews');
  return response.data;
};

// ==================== PRODUCT APIs ====================


export const searchProducts = async (keyword) => {
  const response = await api.get(`/products/search?q=${keyword}`);
  return response.data;
};


export const getProducts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/products?${queryString}`);
  return response.data;
};


export const getProductDetail = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

// ==================== CATEGORY & BRAND APIs ====================


export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};


export const getBrands = async () => {
  const response = await api.get('/brands');
  return response.data;
};

// ==================== CART APIs ====================


export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};


export const addToCart = async (data) => {
  const response = await api.post('/cart/add', data);
  return response.data;
};


export const updateCartItem = async (data) => {
  const response = await api.post('/cart/update', data);
  return response.data;
};


export const removeFromCart = async (data) => {
  const response = await api.post('/cart/remove', data);
  return response.data;
};

// ==================== ORDER APIs ====================

export const createOrder = async (orderData) => {
  const response = await api.post('/orders/create', orderData);
  return response.data;
};

export const getOrderHistory = async () => {
  const response = await api.get('/orders/my-history');
  return response.data;
};


export const getOrderDetail = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};


export const cancelOrder = async ({ orderId, cancel_reason }) => {
  const response = await api.put(`/orders/${orderId}/cancel`, { cancel_reason });
  return response.data;
};

// ==================== REVIEW APIs ====================

export const createReview = async (reviewData) => {
  const response = await api.post('/reviews/create', reviewData);
  return response.data;
};

export const getProductReviews = async (productId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/reviews/product/${productId}?${queryString}`);
  return response.data;
};


export const createReviewReply = async (reviewId, replyData) => {
  const response = await api.post(`/reviews/${reviewId}/reply`, replyData);
  return response.data;
};

// ==================== COUPON APIs ====================

export const getAvailableCoupons = async () => {
  const response = await api.get('/coupons/available');
  return response.data;
};

export const applyCoupon = ({ code, subtotal }) => {
  return api.post("/coupons/apply", {
    code: code,
    total_amount: subtotal,
  }).then(res => res.data);
};

// ==================== ADMIN APIs ====================

export const getAdminUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/users?${queryString}`);
  return response.data;
};

export const getAdminProducts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/products?${queryString}`);
  return response.data;
};

export const createProduct = async (formData) => {
  const response = await api.post('/admin/products/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProduct = async (productId, formData) => {
  const response = await api.put(`/admin/products/${productId}/update`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/admin/products/${productId}`);
  return response.data;
};

export const getAdminOrders = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/orders?${queryString}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
   const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

export const getAdminCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data;
};

export const createCoupon = async (couponData) => {
  const response = await api.post('/admin/coupons/create', couponData);
  return response.data;
};

export const updateCoupon = async (couponId, couponData) => {
  const response = await api.put(`/admin/coupons/${couponId}/update`, couponData);
  return response.data;
};

export const deleteCoupon = async (couponId) => {
  const response = await api.delete(`/admin/coupons/${couponId}`);
  return response.data;
};

export const getRevenueStatistics = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/statistics/revenue?${queryString}`);
  return response.data;
};

export const getTopProducts = async ({ month }) => {
  const response = await api.get(
    '/admin/statistics/top-products',
    { params: { month } }
  );
  return response.data;
};

/**
 * ==================== ADMIN CATEGORIES APIs ====================
 */

export const getAdminCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/admin/categories/create', categoryData);
  return response.data;
};

export const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/admin/categories/${categoryId}/update`, categoryData);
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/admin/categories/${categoryId}`);
  return response.data;
};

/**
 * ==================== ADMIN BRANDS APIs ====================
 */

export const getAdminBrands = async () => {
  const response = await api.get('/admin/brands');
  return response.data;
};

export const createBrand = async (brandData) => {
  const response = await api.post('/admin/brands/create', brandData);
  return response.data;
};

export const updateBrand = async (brandId, brandData) => {
  const response = await api.put(`/admin/brands/${brandId}/update`, brandData);
  return response.data;
};

export const deleteBrand = async (brandId) => {
  const response = await api.delete(`/admin/brands/${brandId}`);
  return response.data;
};

/**
 * ==================== PAYMENT APIs ====================
 */


export const createMoMoPayment = async (data) => {
  const response = await api.post('/payments/momo/create', data);
  return response.data;
};

/**
 * ==================== CHATBOX APIs ====================
 */

export const chatWithAI = async (data) => {
  const response = await api.post('/chatbox/chat', data);
  return response.data;
};

// Dashboard
export const getOrderStatusStatistics = async ({ month }) => {
  const response = await api.get(
    "/admin/statistics/order-status",
    { params: { month } }
  );
  return response.data;
};

export default api;

