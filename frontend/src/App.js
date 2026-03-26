import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import Chatbox from './components/Chatbox';
import ScrollToTop from "./components/ScrollToTop";
import CompareBar from "./components/CompareBar";

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ComparePage from "./pages/ComparePage";
 import PaymentResultPage from "./pages/PaymentResultPage";

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminUsers from './pages/admin/Users';
import AdminCoupons from './pages/admin/Coupons';
import AdminCategories from './pages/admin/Categories';
import AdminBrands from './pages/admin/Brands';

// PageFooter
import WarrantyPolicy from "./pages/pagefooter/WarrantyPolicy";
import PurchaseGuide from "./pages/pagefooter/PurchaseGuide";
import FAQ from "./pages/pagefooter/FAQ";
import VerifyOTPPage from "./pages/email/VerifyOTPPage";
import ResetPasswordPage from "./pages/email/ResetPasswordPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ClientLayout({ children }) {
  return (
    <div className="App">
      <Header />
       <CompareBar /> 
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
         <ScrollToTop />  
        <Routes>
          {/* Admin Routes - Đặt trước để match trước */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
          <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
          <Route path="/admin/brands" element={<AdminLayout><AdminBrands /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
          <Route path="/admin/orders/:orderId" element={<AdminLayout><AdminOrderDetail /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/coupons" element={<AdminLayout><AdminCoupons /></AdminLayout>} />

          {/* Client Routes */}
          <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
          <Route path="/products" element={<ClientLayout><ProductsPage /></ClientLayout>} />
          <Route path="/products/:productId" element={<ClientLayout><ProductDetailPage /></ClientLayout>} />
          <Route path="/cart" element={<ClientLayout><CartPage /></ClientLayout>} />
          <Route path="/checkout" element={<ClientLayout><CheckoutPage /></ClientLayout>} />
          <Route path="/login" element={<ClientLayout><LoginPage /></ClientLayout>} />
          <Route path="/register" element={<ClientLayout><RegisterPage /></ClientLayout>} />
          <Route path="/profile" element={<ClientLayout><ProfilePage /></ClientLayout>} />
          <Route path="/orders" element={<ClientLayout><OrderHistoryPage /></ClientLayout>} />
          <Route path="/orders/:orderId" element={<ClientLayout><OrderDetailPage /></ClientLayout>} />
          <Route path="/compare" element={<ClientLayout><ComparePage /></ClientLayout>} />
          <Route path="/payment-result" element={<PaymentResultPage />} />

          {/*Page footer */}
           <Route path="/warranty-policy" element={<ClientLayout><WarrantyPolicy /></ClientLayout>  } />
           <Route path="/purchase-guide" element={<ClientLayout><PurchaseGuide /></ClientLayout>} />
           <Route path="/faq" element={<ClientLayout><FAQ /></ClientLayout>} />
           
          {/*Page email */}
            <Route path="/verify-otp" element={<ClientLayout><VerifyOTPPage /></ClientLayout>} />
            <Route path="/reset-password" element={<ClientLayout><ResetPasswordPage /></ClientLayout>} />
         </Routes>
        
        <Chatbox />
      </Router>
    </QueryClientProvider>
  );
}

export default App;

