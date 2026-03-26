

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../utils/api';

function AdminCategories() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      setShowForm(false);
      setEditingCategory(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      status: category.status || 'active',
    });
    setShowForm(true);
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này? Lưu ý: Không thể xóa danh mục đang có sản phẩm.')) {
      deleteMutation.mutate(categoryId, {
        onError: (error) => {
          alert(error.response?.data?.error || 'Không thể xóa danh mục này');
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    resetForm();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quản lý danh mục</h1>
        <button onClick={() => setShowForm(true)} style={styles.addButton}>
          + Thêm danh mục
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
          <div style={styles.formGroup}>
            <label>Tên danh mục *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={styles.input}
              placeholder="VD: Điện thoại"
            />
          </div>
          <div style={styles.formGroup}>
            <label>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={styles.textarea}
              rows={3}
              placeholder="Mô tả về danh mục..."
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
          <div style={styles.formActions}>
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Cập nhật' : 'Tạo mới'}
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

      {/* Categories list */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeadCell}>ID</th>
              <th style={styles.tableHeadCell}>Tên</th>
              <th style={styles.tableHeadCell}>Mô tả</th>
              <th style={styles.tableHeadCell}>Số sản phẩm</th>
              <th style={styles.tableHeadCell}>Trạng thái</th>
              <th style={styles.tableHeadCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categoriesData?.categories?.map((category, index) => (
              <tr 
                key={category.id}
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
                <td style={styles.tableBodyCell}>{category.id}</td>
                <td style={{...styles.tableBodyCell, fontWeight: '500'}}>{category.name}</td>
                <td style={styles.tableBodyCell}>
                  <span style={{color: category.description ? '#212529' : '#6c757d'}}>
                    {category.description || '-'}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#e7f3ff',
                    color: '#004085',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    {category.product_count || 0}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: category.status === 'active' ? '#28a745' : '#6c757d',
                  }}>
                    {category.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(category)}
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
                      onClick={() => handleDelete(category.id)}
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
            ))}
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
  title: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#212529',
    margin: 0,
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
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
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
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

export default AdminCategories;

