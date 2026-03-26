

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderDetail, cancelOrder, getImageUrl } from '../utils/api';
import CancelReasonModal from "../components/CancelReasonModal";

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");


  const { data, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => getOrderDetail(orderId)
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      alert('Đơn hàng đã được hủy thành công! Tồn kho và mã giảm giá (nếu có) đã được hoàn lại.');
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-history'] });
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Không thể hủy đơn hàng này. Vui lòng thử lại.');
    },
  });

      const handleCancel = () => {
        const confirmed = window.confirm(
         'Bạn có chắc muốn hủy đơn hàng này?\n\nLưu ý: Đơn hàng đã hủy không thể khôi phục. Tồn kho và mã giảm giá sẽ được hoàn lại.');
      if (!confirmed) return;
      setShowCancelModal(true);
    };

    const handleConfirmCancel = (reason) => {
      cancelMutation.mutate({
        orderId: parseInt(orderId),
        cancel_reason: reason,
      });

      setShowCancelModal(false);
    };

  if (isLoading) {
    return <div className="container">Đang tải...</div>;
  }

  const order = data?.order;
  if (!order) {
    return <div className="container">Không tìm thấy đơn hàng</div>;
  }

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

  const getPaymentStatus = (payment_status) => {
  if (payment_status === 'paid') return { text: 'ĐÃ THANH TOÁN', color: '#28a745' };
  if (payment_status === 'failed') return { text: 'THẤT BẠI', color: '#dc3545' };
  return { text: 'CHƯA THANH TOÁN', color: '#ff9800' };
};

const payStatus = getPaymentStatus(order.payment_status);

  return (
    <div className="container" style={styles.page}>
      <button onClick={() => navigate('/orders')} style={styles.backButton}>
        ← Quay lại
      </button>

      <h1 style={styles.title}>Chi tiết đơn hàng</h1>

      {/* Order info */}
      <div style={styles.orderInfo}>
        <div style={styles.infoRow}>
          <strong>Mã đơn hàng:</strong>
          <span>{order.order_number}</span>
        </div>
        <div style={styles.infoRow}>
          <strong>Trạng thái:</strong>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: getStatusColor(order.status),
            }}
          >
            {getStatusText(order.status)}
          </span>
        </div>
        <div style={styles.infoRow}>
          <strong>Ngày đặt:</strong>
          <span>
            {new Date(order.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Shipping info */}
      <section style={styles.section}>
        <h2>Thông tin giao hàng</h2>
        <div style={styles.shippingInfo}>
          <p>
            <strong>Người nhận:</strong> {order.recipient_name}
          </p>
          <p>
            <strong>Số điện thoại:</strong> {order.recipient_phone}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {order.shipping_address}
          </p>
          <p>
            <strong>Phương thức thanh toán:</strong>{' '}
            {order.payment_method === 'cod'
              ? 'Thanh toán khi nhận hàng'
              : order.payment_method === 'bank_transfer'
              ? 'Chuyển khoản'
              : 'MoMo'}
          </p>
          <p style={{ fontWeight: 'bold', marginTop: '5px', color: payStatus.color }}>
            <strong>Trạng thái thanh toán:</strong> {payStatus.text}
          </p>
        </div>
      </section>

      {/* Order items */}
      <section style={styles.section}>
        <h2>Sản phẩm</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Giá</th>
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody>
           {(order.items || [])
    .filter(Boolean)
    .map((item) => (
      <tr key={item.product_id}>
        <td style={styles.productCell}>
          <img
            src={item.image ? getImageUrl(item.image) : '/placeholder.jpg'}
            alt={item.product_name}
            style={styles.productImage}
          />
          <span>{item.product_name}</span>
        </td>
        <td>{item.quantity}</td>
        <td>
          {new Intl.NumberFormat('vi-VN').format(item.price)} đ
        </td>
        <td>
          {new Intl.NumberFormat('vi-VN').format(
            item.price * item.quantity
          )} đ
        </td>
      </tr>
    ))}
          </tbody>
        </table>
      </section>

      {/* Order summary */}
      <section style={styles.section}>
        <h2>Tóm tắt đơn hàng</h2>
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span>Tạm tính:</span>
            <span>
              {new Intl.NumberFormat('vi-VN').format(order.subtotal)} đ
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span>Phí vận chuyển:</span>
            <span>
              {new Intl.NumberFormat('vi-VN').format(order.shipping_fee)} đ
            </span>
          </div>
          {order.discount > 0 && (
            <div style={styles.summaryRow}>
              <span>Giảm giá:</span>
              <span style={styles.discount}>
                -{new Intl.NumberFormat('vi-VN').format(order.discount)} đ
              </span>
            </div>
          )}
          <div style={styles.totalRow}>
            <span>Tổng cộng:</span>
            <strong style={styles.totalAmount}>
              {new Intl.NumberFormat('vi-VN').format(order.total)} đ
            </strong>
          </div>
        </div>
      </section>

      {/* Cancel button (only for pending orders) */}
      {order.status === 'pending' && (
        <div style={styles.cancelSection}>
        <button 
          onClick={handleCancel}
          style={styles.cancelButton}
        >
          Hủy đơn hàng
        </button>
          <p style={styles.cancelNote}>
            💡 Bạn chỉ có thể hủy đơn hàng khi đơn hàng đang ở trạng thái "Chờ xử lý". 
          </p>
        </div>
      )}

      {showCancelModal && (
        <CancelReasonModal
          onClose={() => setShowCancelModal(false)}
          onSubmit={(reason) => handleConfirmCancel(reason)}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '40px 20px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  title: {
    fontSize: '32px',
    marginBottom: '30px',
  },
  orderInfo: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '30px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  statusBadge: {
    padding: '5px 15px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
  },
  shippingInfo: {
    marginTop: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  productImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '5px',
  },
  summary: {
    marginTop: '15px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  discount: {
    color: '#28a745',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '15px',
    borderTop: '2px solid #ddd',
    fontSize: '20px',
  },
  totalAmount: {
    fontSize: '24px',
    color: '#007bff',
  },
  cancelSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '10px',
    border: '1px solid #ffc107',
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '10px',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  cancelNote: {
    margin: '10px 0 0 0',
    fontSize: '14px',
    color: '#856404',
    lineHeight: '1.5',
  },
  bankInfo: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '10px',
    marginTop: '30px',
  },
};

export default OrderDetailPage;

