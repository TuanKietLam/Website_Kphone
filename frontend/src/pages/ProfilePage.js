

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, changePassword, getMyReviews,getImageUrl } from '../utils/api';

function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile'); 
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile
  });

  const { data: myReviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviews,
    enabled: activeTab === 'reviews', 
  });

  // Load data vào form
  React.useEffect(() => {
    if (userData?.user) {
      setProfileData({
        name: userData.user.name || '',
        phone: userData.user.phone || '',
        address: userData.user.address || '',
      });
    }
  }, [userData]);

  // Mutation để cập nhật profile
  const updateProfileMutation = useMutation({
   mutationFn: updateUserProfile,
  onSuccess: (data) => {
      alert('Cập nhật thông tin thành công!');

      // 🔥 1. CẬP NHẬT LẠI localStorage.user
      const oldUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = {
        ...oldUser,
        name: data.user.name,
        phone: data.user.phone,
        address: data.user.address,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // 🔔 2. BẮN EVENT CHO HEADER BIẾT
      window.dispatchEvent(new Event('userUpdated'));

      // 3. Refresh lại profile
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  // Mutation để đổi mật khẩu
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      alert('Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
  });

  // Xử lý cập nhật profile
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (profileData.name && !isValidName(profileData.name)) {
      alert('Họ tên không được chứa ký tự đặc biệt hoặc số');
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const isValidName = (name) => {
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    return nameRegex.test(name.trim());
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  return (
    <div className="container" style={styles.page}>
      <h1 style={styles.title}>Thông tin tài khoản</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            ...styles.tab,
            ...(activeTab === 'profile' ? styles.activeTab : {}),
          }}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            ...styles.tab,
            ...(activeTab === 'password' ? styles.activeTab : {}),
          }}
        >
          Đổi mật khẩu
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            ...styles.tab,
            ...(activeTab === 'reviews' ? styles.activeTab : {}),
          }}
        >
          Đánh giá của tôi
        </button>
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div style={styles.tabContent}>
          <form onSubmit={handleUpdateProfile} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Họ và tên</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={userData?.user?.email || ''}
                disabled
                style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
              />
              <small>Email không thể thay đổi</small>
            </div>

            <div style={styles.formGroup}>
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Địa chỉ</label>
              <textarea
                value={profileData.address}
                onChange={(e) =>
                  setProfileData({ ...profileData, address: e.target.value })
                }
                style={styles.textarea}
                rows={3}
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Cập nhật thông tin
            </button>
          </form>
        </div>
      )}

      {/* Password tab */}
      {activeTab === 'password' && (
        <div style={styles.tabContent}>
          <form onSubmit={handleChangePassword} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Mật khẩu cũ</label>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    oldPassword: e.target.value,
                  })
                }
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label>Mật khẩu mới</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                style={styles.input}
                required
                minLength={6}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                style={styles.input}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Đổi mật khẩu
            </button>
          </form>
        </div>
      )}
      {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div style={styles.tabContent}>
            <h2 style={styles.reviewTitle}>Đánh giá của tôi</h2>

            {reviewsLoading && <p>Đang tải đánh giá...</p>}

            {!reviewsLoading && myReviewsData?.reviews?.length === 0 && (
              <p>Bạn chưa đánh giá sản phẩm nào.</p>
            )}

            {!reviewsLoading &&
              myReviewsData?.reviews?.map((review) => (
                <div key={review.id} style={styles.reviewItem}>
                  <div style={styles.reviewRow}>
                    <img
                      src={review.image ? getImageUrl(review.image) : '/placeholder.jpg'}
                      alt={review.product_name}
                      style={styles.reviewImage}
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                    />

                    <div style={styles.reviewContent}>
                      <strong style={styles.reviewProductName}>
                        {review.product_name}
                      </strong>

                      <p style={styles.reviewRating}>
                        ⭐ {review.rating} / 5
                      </p>

                      <p style={styles.reviewComment}>
                        {review.comment}
                      </p>

                      <small style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleString('vi-VN')}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
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
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #ddd',
  },
  tab: {
    padding: '15px 30px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
  },
  activeTab: {
    borderBottomColor: '#007bff',
    color: '#007bff',
  },
  tabContent: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px',
  },
  form: {
    maxWidth: '600px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    resize: 'vertical',
  },
  submitButton: {
    padding: '15px 40px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    cursor: 'pointer',
  },
  reviewTitle: {
  marginBottom: '20px',
  },

  reviewItem: {
    borderBottom: '1px solid #ddd',
    padding: '16px 0',
  },

  reviewRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },

  reviewImage: {
    width: 70,
    height: 70,
    objectFit: 'cover',
    borderRadius: 6,
  },

  reviewContent: {
    flex: 1,
  },

  reviewProductName: {
    fontSize: '16px',
    display: 'block',
    marginBottom: '4px',
  },

  reviewRating: {
    margin: '4px 0',
    color: '#f5a623',
    fontWeight: 500,
  },

  reviewComment: {
    margin: '4px 0',
  },

  reviewDate: {
    color: '#666',
    fontSize: '13px',
  },
};

export default ProfilePage;

