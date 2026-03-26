

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderDetail, updateOrderStatus, getImageUrl } from '../../utils/api';

function AdminOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => getOrderDetail(orderId)
  });

  const updateStatusMutation = useMutation({
  mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
  onSuccess: () => {
    // Chỉ cần refetch — cách an toàn, đúng dữ liệu, không crash
    queryClient.invalidateQueries(['admin-order-detail', orderId]);
    queryClient.invalidateQueries(['admin-orders']);
    alert('Cập nhật trạng thái thành công!');
  },
});

  const handleUpdateStatus = (newStatus) => {
    if (window.confirm(`Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${getStatusText(newStatus)}"?`)) {
      updateStatusMutation.mutate({ orderId: parseInt(orderId), status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>Không tìm thấy đơn hàng</div>
        <button onClick={() => navigate('/admin/orders')} style={styles.backButton}>
          Quay lại
        </button>
      </div>
    );
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

  const getStatusBadgeStyle = (status) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: getStatusColor(status),
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-block',
  });

  // CHẶN KHÔNG CHO LÙI TRẠNG THÁI
  const statusOrder = {
    pending: 1,
    processing: 2,
    shipping: 3,
    completed: 4,
    cancelled: 99, // trạng thái kết thúc
  };

  const canChangeTo = (targetStatus) => {
    const current = order.status;

    // Hoàn thành hoặc hủy → khóa hoàn toàn
    if (current === "completed" || current === "cancelled") return false;

    // Chỉ cho tăng tiến, không được giảm
    return statusOrder[targetStatus] > statusOrder[current];
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/admin/orders')} style={styles.backButton}>
          ← Quay lại
        </button>
        <h1 style={styles.title}>Chi tiết đơn hàng</h1>
      </div>

      {/* Order Info Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.orderNumber}>Đơn hàng #{order.order_number}</h2>

            <p style={styles.orderDate}>
              Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>

            {order.status === "cancelled" && order.cancel_reason && (
              <div style={styles.cancelBox}>
                <h5>Lý do hủy đơn:</h5>
                <p style={styles.cancelReason}>{order.cancel_reason}</p>
              </div>
            )}
          </div>
          <div>
            <span style={getStatusBadgeStyle(order.status)}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={styles.grid}>
        {/* Left Column - Customer & Shipping Info */}
        <div style={styles.leftColumn}>
          {/* Customer Info */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Thông tin khách hàng</h3>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Tên:</span>
              <span style={styles.infoValue}>{order.recipient_name}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email:</span>
              <span style={styles.infoValue}>{order.user_email || '-'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Số điện thoại:</span>
              <span style={styles.infoValue}>{order.recipient_phone}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Địa chỉ giao hàng</h3>
            <p style={styles.address}>{order.shipping_address}</p>
          </div>

          {/* Payment Info */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Thông tin thanh toán</h3>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Phương thức:</span>
              <span style={styles.infoValue}>
                {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Trạng thái thanh toán:</span>
              <span style={styles.infoValue}>
                {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Order Items & Summary */}
        <div style={styles.rightColumn}>
          {/* Order Items */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Sản phẩm đã đặt</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={styles.itemsTableHeader}>Sản phẩm</th>
                    <th style={styles.itemsTableHeader}>Giá</th>
                    <th style={styles.itemsTableHeader}>Số lượng</th>
                    <th style={styles.itemsTableHeader}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
             {(order.items || [])
  .filter(Boolean)
  .map((item) => (
    <tr key={item.product_id} style={styles.itemsTableRow}>
      <td style={styles.itemsTableCell}>
        <div style={styles.productInfo}>
          <img
            src={item.image ? getImageUrl(item.image) : '/placeholder.jpg'}
            alt={item.product_name}
            style={styles.productImage}
          />
          <div>
            <div style={styles.productName}>{item.product_name}</div>
          </div>
        </div>
      </td>

      <td style={styles.priceCell}>
        {new Intl.NumberFormat("vi-VN").format(item.price)} đ
      </td>

      <td style={styles.itemsTableCell}>
        {item.quantity}
      </td>

      <td style={styles.totalCell}>
        {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)} đ
      </td>
    </tr>
))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Tổng kết đơn hàng</h3>
            <div style={styles.summaryRow}>
              <span>Tạm tính:</span>
              <span>{new Intl.NumberFormat('vi-VN').format(order.subtotal || order.total)} đ</span>
            </div>
            {order.discount > 0 && (
              <>
                <div style={styles.summaryRow}>
                  <span>Giảm giá:</span>
                  <span style={{ color: '#28a745', fontWeight: '500' }}>
                    -{new Intl.NumberFormat('vi-VN').format(order.discount)} đ
                  </span>
                </div>
                {order.coupon_code && (
                  <div style={styles.summaryRow}>
                    <span>Mã giảm giá:</span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      backgroundColor: '#e7f3ff',
                      color: '#007bff',
                      fontSize: '13px',
                      fontWeight: '600',
                      letterSpacing: '1px',
                    }}>
                      {order.coupon_code}
                    </span>
                  </div>
                )}
              </>
            )}
            <div style={styles.summaryRow}>
              <span>Phí vận chuyển:</span>
              <span>{new Intl.NumberFormat('vi-VN').format(order.shipping_fee || 0)} đ</span>
            </div>
            <div style={styles.summaryDivider}></div>
            <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
              <span style={styles.totalLabel}>Tổng cộng:</span>
              <span style={styles.totalValue}>
                {new Intl.NumberFormat('vi-VN').format(order.total)} đ
              </span>
            </div>
          </div>

          {/* Status Update */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Cập nhật trạng thái</h3>
            
            <div style={styles.statusButtons}>

              {/* pending */}
              <button
                onClick={() => handleUpdateStatus("pending")}
                disabled={!canChangeTo("pending") || updateStatusMutation.isPending}
                style={{
                  ...styles.statusButton,
                  ...(order.status === "pending"
                    ? { backgroundColor: getStatusColor("pending") }
                    : {}),
                }}
              >
                Chờ xử lý
              </button>

              {/* processing */}
              <button
                onClick={() => handleUpdateStatus("processing")}
                disabled={!canChangeTo("processing") || updateStatusMutation.isPending}
                style={{
                  ...styles.statusButton,
                  ...(order.status === "processing"
                    ? { backgroundColor: getStatusColor("processing") }
                    : {}),
                }}
              >
                Đang xử lý
              </button>

              {/* shipping */}
              <button
                onClick={() => handleUpdateStatus("shipping")}
                disabled={!canChangeTo("shipping") || updateStatusMutation.isPending}
                style={{
                  ...styles.statusButton,
                  ...(order.status === "shipping"
                    ? { backgroundColor: getStatusColor("shipping") }
                    : {}),
                }}
              >
                Đang giao hàng
              </button>

              {/* completed */}
              <button
                onClick={() => handleUpdateStatus("completed")}
                disabled={!canChangeTo("completed") || updateStatusMutation.isPending}
                style={{
                  ...styles.statusButton,
                  ...(order.status === "completed"
                    ? { backgroundColor: getStatusColor("completed") }
                    : {}),
                }}
              >
                Hoàn thành
              </button>

              {/* cancelled */}
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={!canChangeTo("cancelled") || updateStatusMutation.isPending}
                style={{
                  ...styles.statusButton,
                  ...styles.statusButtonDanger,
                  ...(order.status === "cancelled"
                    ? { backgroundColor: getStatusColor("cancelled") }
                    : {}),
                }}
              >
                Hủy đơn
              </button>

            </div>
           
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '40px 20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#6c757d',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#dc3545',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#212529',
    margin: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e9ecef',
  },
  orderNumber: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#007bff',
    margin: '0 0 8px 0',
  },
  orderDate: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '20px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#212529',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f8f9fa',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#6c757d',
    fontSize: '14px',
  },
  infoValue: {
    fontWeight: '500',
    color: '#212529',
    fontSize: '14px',
    textAlign: 'right',
  },
  address: {
    fontSize: '14px',
    color: '#212529',
    lineHeight: '1.6',
    margin: 0,
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  itemsTableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px',
    color: '#333b42ff',
    textTransform: 'uppercase',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  itemsTableRow: {
    borderBottom: '1px solid #e9ecef',
  },
  itemsTableCell: {
    padding: '16px 12px',
    fontSize: '14px',
  },
  productInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  productName: {
    fontWeight: '500',
    color: '#212529',
    fontSize: '14px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: '14px',
    color: '#212529',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: '#dee2e6',
    margin: '12px 0',
  },
  totalRow: {
    marginTop: '8px',
    paddingTop: '16px',
    borderTop: '2px solid #dee2e6',
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#212529',
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#28a745',
  },
  statusButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  statusButton: {
    padding: '10px 20px',
    backgroundColor: '#b3b1b1ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    flex: '1',
    minWidth: '120px',
  },
  statusButtonColor: (color) => ({
    backgroundColor: color,
    color: "white",
  }),
  statusButtonDanger: {
    backgroundColor: '#dc3545',
  },
  priceCell: {
    whiteSpace: "nowrap",
    textAlign: "right",
    fontWeight: "500",
  },

  totalCell: {
    whiteSpace: "nowrap",
    textAlign: "right",
    fontWeight: "700",
  },
  // Lý do hủy
  cancelBox: {
  backgroundColor: "#ffe8e8",
  border: "1px solid #ffb3b3",
  padding: "9px 15px",
  borderRadius: "8px",
  marginTop: "10px",
  },

  cancelReason: {
    margin: "6px 0 0 0",
    color: "#b30000",
    fontWeight: "350",
  }
};

export default AdminOrderDetail;

