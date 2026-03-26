

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminUsers } from '../../utils/api';

function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', { search, page }],
    queryFn: () => getAdminUsers({ search, page, limit: 20 })
  });

  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Quản lý khách hàng</h1>

      {/* Search */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={styles.searchInput}
        />
      </div>

      {/* Users table */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <table style={styles.table}>
           <thead style={styles.tableHead}>
      <tr>
        <th style={styles.tableHeadCell}>ID</th>
        <th style={styles.tableHeadCell}>Tên</th>
        <th style={styles.tableHeadCell}>Email</th>
        <th style={styles.tableHeadCell}>Số điện thoại</th>
        <th style={styles.tableHeadCell}>Địa chỉ</th>
        <th style={styles.tableHeadCell}>Tổng đơn</th>
        <th style={styles.tableHeadCell}>Tổng tiền</th>
        <th style={styles.tableHeadCell}>Vai trò</th>
        <th style={styles.tableHeadCell}>Ngày tạo</th>
      </tr>
    </thead>

    <tbody>
      {usersData?.users?.map((user, index) => (
        <tr
          key={user.id}
          style={{
            ...styles.tableRow,
            ...(index % 2 === 0
              ? styles.tableRowEven
              : styles.tableRowOdd),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e9ecef';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              index % 2 === 0 ? '#ffffff' : '#f8f9fa';
          }}
        >
          {/* ID */}
          <td style={styles.tableBodyCell}>{user.id}</td>

          {/* TÊN */}
          <td style={{ ...styles.tableBodyCell, fontWeight: 500 }}>
            {user.name}
          </td>

          {/* EMAIL */}
          <td style={styles.tableBodyCell}>{user.email}</td>

          {/* SĐT */}
          <td style={styles.tableBodyCell}>
            {user.phone || '-'}
          </td>

          {/* ĐỊA CHỈ */}
          <td style={styles.tableBodyCell}>
            <span
              style={{
                color: user.address ? '#212529' : '#6c757d',
              }}
            >
              {user.address || '-'}
            </span>
          </td>

          {/* ⭐ TỔNG ĐƠN */}
          <td style={{ ...styles.tableBodyCell, fontWeight: 600 }}>
            {user.total_orders ?? 0}
          </td>

          {/* ⭐ TỔNG TIỀN */}
          <td
            style={{
              ...styles.tableBodyCell,
              fontWeight: 600,
              color: '#198754',
            }}
          >
            {user.total_spent
              ? new Intl.NumberFormat('vi-VN').format(
                  user.total_spent
                ) + ' đ'
              : '0 đ'}
          </td>

          {/* VAI TRÒ */}
          <td style={styles.tableBodyCell}>
            <span
              style={{
                ...styles.roleBadge,
                backgroundColor:
                  user.role === 'admin'
                    ? '#dc3545'
                    : '#007bff',
              }}
            >
              {user.role === 'admin'
                ? 'Admin'
                : 'Khách hàng'}
            </span>
          </td>

          {/* NGÀY TẠO */}
          <td style={styles.tableBodyCell}>
            {new Date(user.created_at).toLocaleDateString(
              'vi-VN',
              {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }
            )}
          </td>
        </tr>
      ))}
    </tbody>
        </table>
      </div>

      {/* Pagination */}
      {usersData?.pagination && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Trước
          </button>
          <span>
            Trang {page} / {usersData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= usersData.pagination.totalPages}
          >
            Sau
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
  searchBar: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ced4da',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
  roleBadge: {
    padding: '6px 12px',
    borderRadius: '15px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-flex',
    whiteSpace: 'nowrap',
    justifyContent: 'center',
    minWidth: '90px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '30px',
    padding: '20px',
  },
};

export default AdminUsers;

