import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../utils/api';

function AdminCoupons() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [apiError, setApiError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    max_usage: '',
    expiry_date: '',
    status: 'active',
  });

  const { data: couponsData } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getAdminCoupons
  });

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
    },
  });

      const buildUpdatePayload = () => {
      if (!editingCoupon) return formData;

      const isUsed = editingCoupon.usage_count > 0;
      if (!isUsed) {
        return formData;
      }
      return {
        expiry_date: formData.expiry_date,
        status: formData.status,
      };
    };

    const isEditingUsedCoupon =
  editingCoupon && editingCoupon.usage_count > 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCoupon(id, data),
    onSuccess: () => {
      setApiError('');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
    },
    onError: (error) => {
    const message =
      error?.response?.data?.error ||
      'Có lỗi xảy ra khi cập nhật mã giảm giá';
    setApiError(message);
  },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (error) => {
    alert(
      error?.response?.data?.error || 'Không thể xóa mã giảm giá'
    );
  },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount: '',
      max_usage: '',
      expiry_date: '',
      status: 'active',
    });
  };

  const handleEdit = (coupon) => {
    setApiError('');
    setEditingCoupon(coupon);
    const expiryDate = new Date(coupon.expiry_date);
    const formattedDate = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const formatNumberForInput = (value) => {
      if (!value) return '';
      const num = typeof value === 'string' 
        ? parseFloat(value.replace(/,/g, '')) 
        : parseFloat(value);
      return isNaN(num) ? '' : Math.floor(num).toString();
    };

    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: formatNumberForInput(coupon.discount_value),
      min_order_amount: formatNumberForInput(coupon.min_order_amount),
      max_discount: formatNumberForInput(coupon.max_discount),
      max_usage: coupon.max_usage || '',
      expiry_date: formattedDate,
      status: coupon.status || 'active',
    });
    setShowForm(true);
  };

  const handleDelete = (couponId) => {
    if (window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) {
      deleteMutation.mutate(couponId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

      const discountValue = Number(formData.discount_value);
      const minOrder = Number(formData.min_order_amount || 0);
      const maxDiscount = Number(formData.max_discount || 0);
      const maxUsage = Number(formData.max_usage || 0);
            
      if (!formData.code.trim()) {
         setApiError("Mã giảm giá không được để trống");
        return;
      }

      if (Number.isNaN(discountValue) || discountValue <= 0) {
        setApiError("Giá trị giảm phải là số > 0");
        return;
      }

      if (formData.discount_type === "percentage" && discountValue > 100) {
        setApiError("Giảm theo % không được vượt quá 100%");
        return;
      }

      if (minOrder && minOrder <= 0) {
        setApiError("Đơn hàng tối thiểu phải > 0");
        return;
      }

      if (maxDiscount && maxDiscount <= 0) {
        setApiError("Mức giảm tối đa phải > 0");
        return;
      }

      if (maxUsage && maxUsage <= 0) {
        setApiError("Số lần sử dụng phải > 0");
        return;
      }
      const payload = {
        ...formData,
        discount_value: discountValue,
        min_order_amount: minOrder || null,
        max_discount: maxDiscount || null,
        max_usage: maxUsage || null,
      };
    if (editingCoupon) {
    updateMutation.mutate({
        id: editingCoupon.id,
        data: buildUpdatePayload()
      });
    } else {
      createMutation.mutate(payload);
    }
    
  };

  const handleCancel = () => {
    setApiError('');
    setShowForm(false);
    setEditingCoupon(null);
    resetForm();
  };

  return (
    <div className="container" style={styles.page}>
      <div style={styles.header}>
        <h1>Quản lý mã giảm giá</h1>
        <button onClick={() => setShowForm(true)} style={styles.addButton}>
          + Tạo mã mới
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2>{editingCoupon ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label>Mã giảm giá *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                disabled={!!editingCoupon}
                style={{...styles.input, ...(editingCoupon ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {})}}
                placeholder="VD: TECH10"
              />
              {editingCoupon && (
                <small style={{color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '5px'}}>
                  Không thể thay đổi mã giảm giá
                </small>
              )}
            </div>
            <div style={styles.formGroup}>
              <label>Loại giảm giá *</label>
              <select
                value={formData.discount_type}
                disabled={isEditingUsedCoupon}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                style={styles.input}
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Giá trị giảm *</label>
             <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  disabled={isEditingUsedCoupon}
  value={formData.discount_value}
  onChange={(e) => {
    const v = e.target.value;
    if (/^\d*$/.test(v)) {
      setFormData({ ...formData, discount_value: v });
    }
  }}
  required
  style={styles.input}
  placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
/>
            </div>
            <div style={styles.formGroup}>
              <label>Đơn hàng tối thiểu</label>
             <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  disabled={isEditingUsedCoupon}
  value={formData.min_order_amount}
  onChange={(e) => {
    const v = e.target.value;
    if (/^\d*$/.test(v)) {
      setFormData({ ...formData, min_order_amount: v });
    }
  }}
  style={styles.input}
  placeholder="5000000"
/>
            </div>
            <div style={styles.formGroup}>
              <label>Mức giảm tối đa (nếu là %)</label>
             <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  disabled={isEditingUsedCoupon}
  value={formData.max_discount}
  onChange={(e) => {
    const v = e.target.value;
    if (/^\d*$/.test(v)) {
      setFormData({ ...formData, max_discount: v });
    }
  }}
  style={styles.input}
/>
            </div>
            <div style={styles.formGroup}>
              <label>Số lần sử dụng tối đa</label>
              <input
                type="number"
                min={1}
               step={1}
                disabled={isEditingUsedCoupon}
                value={formData.max_usage}
                onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                style={styles.input}
                placeholder="100"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Ngày hết hạn *</label>
              <input
                type="datetime-local"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Trạng thái *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.input}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>
          <div style={styles.formActions}>
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCoupon ? 'Cập nhật' : 'Tạo mã'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelButton}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
      {apiError && (
          <div style={{
            background: '#f8d7da',
            color: '#842029',
            padding: '10px 15px',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid #f5c2c7'
          }}>
            {apiError}
          </div>
        )}
      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeadCell}>Mã</th>
              <th style={styles.tableHeadCell}>Loại</th>
              <th style={styles.tableHeadCell}>Giá trị</th>
              <th style={styles.tableHeadCell}>Đơn tối thiểu</th>
              <th style={styles.tableHeadCell}>Đã dùng</th>
              <th style={styles.tableHeadCell}>Hết hạn</th>
              <th style={styles.tableHeadCell}>Trạng thái</th>
              <th style={styles.tableHeadCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>

            {couponsData?.coupons?.map((coupon, index) => {
                const status = coupon.computed_status || coupon.status;
                const isInactive = status === 'inactive';

                return (
              <tr 
                key={coupon.id}
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
                <td style={styles.tableBodyCell}>
                  <strong style={{color: '#007bff', fontSize: '15px', letterSpacing: '1px'}}>
                    {coupon.code}
                  </strong>
                </td>
                <td style={styles.tableBodyCell}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: coupon.discount_type === 'percentage' ? '#e7f3ff' : '#fff3cd',
                    color: coupon.discount_type === 'percentage' ? '#004085' : '#856404',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    {coupon.discount_type === 'percentage' ? 'Phần trăm' : 'Cố định'}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  <strong style={{color: '#28a745', fontSize: '15px'}}>
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `${new Intl.NumberFormat('vi-VN').format(coupon.discount_value)} đ`}
                  </strong>
                </td>
                <td style={styles.tableBodyCell}>
                  {coupon.min_order_amount > 0
                    ? `${new Intl.NumberFormat('vi-VN').format(coupon.min_order_amount)} đ`
                    : <span style={{color: '#6c757d'}}>Không</span>}
                </td>
                <td style={styles.tableBodyCell}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#f8f9fa',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    {coupon.usage_count} / {coupon.max_usage || '∞'}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  {new Date(coupon.expiry_date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </td>
                <td style={styles.tableBodyCell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: status === 'active' ? '#28a745' : '#6c757d',
                  }}>
                    {status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(coupon)}
                      style={styles.editButton}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0056b3';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 2px 6px rgba(0, 123, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#007bff';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 1px 3px rgba(0, 123, 255, 0.3)';
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      style={styles.deleteButton}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#c82333';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 2px 6px rgba(220, 53, 69, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#dc3545';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 1px 3px rgba(220, 53, 69, 0.3)';
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
              );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '40px 20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
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
    padding: '6px 12px',
    borderRadius: '15px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  editButton: {
    padding: '6px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '5px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 123, 255, 0.3)',
  },
  deleteButton: {
    padding: '6px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(220, 53, 69, 0.3)',
  },
};

export default AdminCoupons;

