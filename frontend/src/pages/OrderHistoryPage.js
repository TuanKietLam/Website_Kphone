

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderHistory, cancelOrder } from '../utils/api';
import CancelReasonModal from "../components/CancelReasonModal";

function OrderHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState(null);

  // Kiểm tra user đã đăng nhập chưa
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?return=/orders');
    }
  }, [navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['order-history'],
    queryFn: getOrderHistory,
    enabled: !!localStorage.getItem('token'), 
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      alert('Đơn hàng đã được hủy thành công!');
      queryClient.invalidateQueries({ queryKey: ['order-history'] });
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Không thể hủy đơn hàng này');
    },
  });

  const handleCancel = (e, orderId) => {
  e.preventDefault();
  e.stopPropagation();
  
  setSelectedOrderId(orderId);
  setShowCancelModal(true);
};

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      processing: '#17a2b8',
      shipping: '#007bff',
      completed: '#28a745',
      cancelled: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  // ⭐ Hàm xử lý trạng thái thanh toán
const getPaymentStatus = (payment_status) => {
  if (payment_status === 'paid') 
    return { text: 'ĐÃ THANH TOÁN', color: '#28a745' };

  if (payment_status === 'failed') 
    return { text: 'THANH TOÁN THẤT BẠI', color: '#dc3545' };

  return { text: 'CHƯA THANH TOÁN', color: '#ff9800' };
}

// Lý do hủy
const handleConfirmCancel = (reason) => {
  if (!selectedOrderId) return;

  cancelMutation.mutate(
    {
      orderId: selectedOrderId,
      cancel_reason: reason,
    },
    {
      onSuccess: () => {
        setShowCancelModal(false);
        setSelectedOrderId(null);
        queryClient.invalidateQueries({ queryKey: ['order-history'] });
      }
    }
  );
};

  // Kiểm tra nếu chưa đăng nhập thì không hiển thị gì (sẽ redirect)
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container" style={styles.page}>
        <h1 style={styles.title}>Lịch sử đơn hàng</h1>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={styles.page}>
        <h1 style={styles.title}>Lịch sử đơn hàng</h1>
        <p style={{ color: 'red' }}>Lỗi khi tải đơn hàng. Vui lòng đăng nhập lại.</p>
        <Link to="/login">Đăng nhập</Link>
      </div>
    );
  }

  const orders = data?.orders || [];

  
  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Lịch sử đơn hàng</h1>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Bạn chưa có đơn hàng nào</p>
          <Link to="/products" style={styles.shopButton}>
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} style={styles.orderCardWrapper}>
              <Link
                to={`/orders/${order.id}`}
                style={styles.orderCard}
              >
                <div style={styles.orderHeader}>
                  <div>
                    <strong>Mã đơn: {order.order_number}</strong>
                    <p style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(order.status),
                    }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div style={styles.orderInfo}>
                  <div>
                    <p>
                      <strong>Người nhận:</strong> {order.recipient_name}
                    </p>
                    <p>
                      <strong>Địa chỉ:</strong> {order.shipping_address}
                    </p>
                    {/* ⭐ Trạng thái thanh toán ⭐ */}
                    {(() => {
                      const ps = getPaymentStatus(order.payment_status);
                      return (
                        <p style={{ fontWeight: 'bold', marginTop: '5px', color: ps.color }}>
                          <strong>Thanh toán:</strong> {ps.text}
                        </p>
                      );
                    })()}
                  </div>
                  <div style={styles.orderTotal}>
                    <strong>
                      {new Intl.NumberFormat('vi-VN').format(order.total)} đ
                    </strong>
                  </div>
                </div>
              </Link>
              
              {/* Nút hủy đơn (chỉ hiển thị khi status là pending) */}
              {order.status === 'pending' && (
                <div style={styles.orderActions}>
                  <button
                    onClick={(e) => handleCancel(e, order.id)}
                    style={styles.cancelButton}
                  >
                    Hủy đơn hàng
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        {showCancelModal && (
          <CancelReasonModal
            onClose={() => setShowCancelModal(false)}
            onSubmit={handleConfirmCancel}
          />
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
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  shopButton: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '15px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  orderCardWrapper: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '10px',
    overflow: 'hidden',
    transition: 'box-shadow 0.3s',
  },
  orderCard: {
    padding: '20px',
    textDecoration: 'none',
    color: '#333',
    display: 'block',
    transition: 'background-color 0.2s',
  },
  orderActions: {
    padding: '15px 20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  orderDate: {
    color: '#666',
    fontSize: '14px',
    marginTop: '5px',
  },
  statusBadge: {
    padding: '5px 15px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  orderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: '20px',
    color: '#007bff',
  },
};

export default OrderHistoryPage;

