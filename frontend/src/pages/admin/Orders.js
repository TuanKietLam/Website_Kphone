import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrders, updateOrderStatus } from '../../utils/api';

const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const format = (date) => date.toISOString().slice(0, 10);
  return {
    from: format(firstDay),
    to: format(lastDay),
  };
};

function AdminOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const { from, to } = getCurrentMonthRange();
  const [fromDate, setFromDate] = React.useState(from);
  const [toDate, setToDate] = React.useState(to);
  const [status, setStatus] = React.useState('');

  const { data: ordersData } = useQuery({
  queryKey: ['admin-orders', page, fromDate, toDate, status, ],
  queryFn: () =>
    getAdminOrders({
      page,
      limit: 20,
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
      ...(status && { status }),
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const handleUpdateStatus = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
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

  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Quản lý đơn hàng</h1>

      <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  }}
>
  {/* BÊN TRÁI: lọc theo ngày */}
  <div style={{ display: 'flex', gap: '12px' }}>
    <input
      type="date"
      value={fromDate}
      onChange={(e) => {
        setPage(1);
        setFromDate(e.target.value);
      }}
    />

    <input
      type="date"
      value={toDate}
      onChange={(e) => {
        setPage(1);
        setToDate(e.target.value);
      }}
    />
  </div>

  {/* BÊN PHẢI: lọc theo trạng thái */}
  <div>
    <select
      value={status}
      onChange={(e) => {
        setPage(1);
        setStatus(e.target.value);
      }}
      style={{ padding: '6px 10px' }}
    >
      <option value="">Tất cả trạng thái</option>
      <option value="pending">Chờ xử lý</option>
      <option value="processing">Đang xử lý</option>
      <option value="shipping">Đang giao</option>
      <option value="completed">Hoàn thành</option>
      <option value="cancelled">Đã hủy</option>
    </select>
  </div>
</div>


      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeadCell}>Mã đơn</th>
              <th style={styles.tableHeadCell}>Khách hàng</th>
              <th style={styles.tableHeadCell}>Ngày đặt</th>
              <th style={styles.tableHeadCell}>Tổng tiền</th>
              <th style={styles.tableHeadCell}>Trạng thái</th>
              <th style={styles.tableHeadCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ordersData?.orders?.map((order, index) => (
              <tr 
                key={order.id}
                style={{
                  ...styles.tableRow,
                  ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                }}
              >
                <td style={{...styles.tableBodyCell, fontWeight: '600', color: '#007bff'}}>
                  {order.order_number}
                </td>
                <td style={styles.tableBodyCell}>
                  <div style={{fontWeight: '500', marginBottom: '4px'}}>{order.user_name}</div>
                  <small style={{color: '#6c757d', fontSize: '12px'}}>{order.user_email}</small>
                </td>
                <td style={styles.tableBodyCell}>
                  {new Date(order.created_at).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </td>
                <td style={styles.tableBodyCell}>
                  <strong style={{color: '#28a745', fontSize: '15px'}}>
                    {new Intl.NumberFormat('vi-VN').format(order.total)} đ
                  </strong>
                </td>
                <td style={styles.tableBodyCell}>
                  <span
                    style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(order.status),
                        }}
                      >
                        {getStatusText(order.status)}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      style={styles.viewButton}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0056b3';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#007bff';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ordersData?.pagination && (
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            fontSize: 14,
          }}
        >
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ←
          </button>

          <strong>
            {ordersData.pagination.page} / {ordersData.pagination.totalPages}
          </strong>

          <button
            disabled={page === ordersData.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            →
          </button>
        </div>
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
    fontWeight: '600',
    color: '#212529',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHead: {
    backgroundColor: '#f8f9fa',
  },
  tableHeadCell: {
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #dee2e6',
  },
  tableBodyCell: {
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    fontSize: '14px',
    color: '#212529',
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8f9fa',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    display: 'inline-block',
  },
  viewButton: {
    padding: '6px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 123, 255, 0.3)',
  },
  statusSelect: {
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    minWidth: '150px',
  },
};

export default AdminOrders;

