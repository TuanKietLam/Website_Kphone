
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, createProduct, updateProduct, deleteProduct, getCategories, getBrands, getImageUrl } from '../../utils/api';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxOpen,
  FaImage,
  FaTags,
  FaWarehouse,
  FaClipboardList,
  FaSave,
  FaTimes,
} from "react-icons/fa";

function AdminProducts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    brand_id: '',
    specs: '',
    accessory_type: '',
  });
  const [images, setImages] = useState([]);

  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getAdminProducts({ limit: 50 })
  });
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      brand_id: '',
      specs: '',
      accessory_type: '',
    });
    setImages([]);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
     setFormKey(prev => prev + 1);
    let formattedSpecs = '';
    if (product.specs) {
      try {
        const parsed = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
        formattedSpecs = JSON.stringify(parsed, null, 2);
      } catch (e) {
        formattedSpecs = product.specs;
      }
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      brand_id: product.brand_id,
      specs: formattedSpecs,
      accessory_type: product.accessory_type || '',
    });
    setShowForm(true);

    setTimeout(() => {
    formRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 0);
  };

  const handleSubmit = (e) => {
      e.preventDefault();

      const priceNumber = Number(formData.price);
        const stockNumber = Number(formData.stock);

      // ==== FRONTEND VALIDATION ====
      if (!formData.name.trim()) return alert("Tên sản phẩm không được để trống!");
      if (Number.isNaN(priceNumber) || priceNumber <= 0) {return alert("Giá sản phẩm phải là số > 0"); }
      if (Number.isNaN(stockNumber) || stockNumber <= 0) {return alert("Số lượng tồn kho phải là số > 0");}
      if (!formData.category_id) return alert("Hãy chọn danh mục!");
      if (!formData.brand_id) return alert("Hãy chọn thương hiệu!");
      if (!formData.description.trim()) return alert("Mô tả không được để trống!");
      if (!formData.specs.trim()) return alert("Thông số kỹ thuật là bắt buộc!");

      // Validate JSON specs
      try {
        JSON.parse(formData.specs);
      } catch (e) {
        return alert("Thông số kỹ thuật phải ở dạng JSON hợp lệ!");
      }

      // Khi tạo mới → PHẢI có ảnh
      if (!editingProduct && images.length === 0) {
        return alert("Bạn phải upload ít nhất 1 ảnh sản phẩm!");
      }

      // ==== CREATE FORM DATA ====
      const formDataObj = new FormData();

      Object.keys(formData).forEach((key) => {
      let value = formData[key];

      if (key === "price") value = priceNumber;
      if (key === "stock") value = stockNumber;

      if (key === "specs") {
        value = JSON.stringify(JSON.parse(value));
      }

      formDataObj.append(key, value);
        });

          images.forEach((image) => {
            formDataObj.append("images", image);
          });

      // ==== SUBMIT ====
      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data: formDataObj });
      } else {
        createMutation.mutate(formDataObj);
      }
    };


  const handleDelete = (productId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      deleteMutation.mutate(productId);
    }
  };

  return (
    <div className="container" style={styles.page}>
      <div style={styles.header}>
        <h1>  <FaBoxOpen /> Quản lý sản phẩm</h1>
        <button  onClick={() => {
              setEditingProduct(null); 
              resetForm();    
               setFormKey(prev => prev + 1);       
              setShowForm(true); 
              
                setTimeout(() => {
                  formRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 0);
            }}
            style={styles.addButton}
          >
          <FaPlus style={{ marginRight: 8 }} /> Thêm sản phẩm
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form  ref={formRef} key={formKey} onSubmit={handleSubmit} style={styles.form}>
          <h2> <FaClipboardList /> {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label><FaTags style={{ marginRight: 6 }} /> Tên sản phẩm *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Giá *</label>
             <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^\d*$/.test(value)) {
                    setFormData({ ...formData, price: value });
                  }
                }}
                placeholder="VD: 100000"
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Số lượng tồn kho *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.stock}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setFormData({ ...formData, stock: value });
                  }
                }}
                placeholder="VD: 10"
                required
                style={styles.input}
              />

            </div>
            <div style={styles.formGroup}>
              <label>Danh mục *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Chọn danh mục</option>
                {categoriesData?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

              {Number(formData.category_id) === 2 &&  (  
            <div style={styles.formGroup}>
              <label>Loại phụ kiện</label>
              <select
                value={formData.accessory_type}
                onChange={(e) => setFormData({ ...formData, accessory_type: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Chọn loại phụ kiện --</option>
                <option value="dây sạc">Dây sạc</option>
                {/* <option value="củ sạc">Củ sạc</option> */}
                <option value="sạc dự phòng">Sạc dự phòng</option>
                <option value="tai nghe">Tai nghe</option>
                {/* <option value="ốp lưng">Ốp lưng</option> */}
              </select>
            </div>
          )}

            <div style={styles.formGroup}>
              <label>Thương hiệu *</label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">Chọn thương hiệu</option>
                {brandsData?.brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label>Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textarea}
                rows={3}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Thông số kỹ thuật</label>
              <textarea
                value={formData.specs}
                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                style={{...styles.textarea, fontFamily: 'monospace', fontSize: '13px'}}
                rows={8}
                placeholder='{"he_dieu_hanh": "Android 15","cpu": "MediaTek Dimensity 6300 5G 8 nhân","toc_do_cpu": "2.4 GHz".....}'
              />
              <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
                Nhập dưới dạng JSON object. Ví dụ: {'{"he_dieu_hanh": "Android 15","cpu": "MediaTek Dimensity 6300 5G 8 nhân"}'}
              </small>
            </div>
            <div style={styles.formGroup}>
              <label>Ảnh sản phẩm</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files))}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>
              <FaSave style={{ marginRight: 6 }} /> {editingProduct ? 'Cập nhật' : 'Tạo mới'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
                resetForm();
              }}
              style={styles.cancelButton}
            >
              <FaTimes style={{ marginRight: 6 }} /> Hủy
            </button>
          </div>
        </form>
      )}

      {/* Products list */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeadCell}>ID</th>
              <th style={styles.tableHeadCell}>Ảnh</th>
              <th style={styles.tableHeadCell}>Tên</th>
              <th style={styles.tableHeadCell}>Giá</th>
              <th style={styles.tableHeadCell}>Tồn kho</th>
              <th style={styles.tableHeadCell}>Danh mục</th>
              <th style={styles.tableHeadCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {productsData?.products?.map((product, index) => (
              <tr 
                key={product.id}
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
                <td style={styles.tableBodyCell}>{product.id}</td>
                <td style={styles.tableBodyCell}>
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    style={styles.productImage}
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                </td>
                <td style={{...styles.tableBodyCell, fontWeight: '500'}}>{product.name}</td>
                <td style={styles.priceCell}>
                    <div style={styles.priceWrapper}>
                      {new Intl.NumberFormat('vi-VN').format(product.price)}
                      <span style={styles.currency}>đ</span>
                    </div>
                </td>
                <td style={styles.tableBodyCell}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: product.stock > 0 ? '#d4edda' : '#f8d7da',
                    color: product.stock > 0 ? '#155724' : '#721c24',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    {product.stock}
                  </span>
                </td>
                <td style={styles.tableBodyCell}>{product.category_name}</td>
                <td style={styles.tableBodyCell}>
                  <button
                    onClick={() => handleEdit(product)}
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
                   <FaEdit style={{ marginRight: 6 }} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
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
                    <FaTrash style={{ marginRight: 6 }} /> Xóa
                  </button>
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
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
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
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    resize: 'vertical',
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
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
     padding: "20px 18px",   // tăng từ 16px lên 20px
    borderBottom: "1px solid #edf0f2",
    fontSize: "14px",
    color: "#212529",
    verticalAlign: "middle",
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
  },
  tableRowHover: {
    backgroundColor: '#f8f9fa',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8f9fa',
  },
  productImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  editButton: {
    padding: '6px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '8px',
    marginBottom: '7px',
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
  priceCell: {
  padding: "20px 18px",
  fontSize: "18px",
  fontWeight: "700",
  color: "#28a745",
  verticalAlign: "middle",
},

priceWrapper: {
  display: "flex",
  alignItems: "baseline",
  gap: "4px",
},

currency: {
  fontSize: "14px",
  fontWeight: "500",
  color: "#28a745",
  opacity: 0.9,
},
};

export default AdminProducts;

