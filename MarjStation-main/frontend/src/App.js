import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "./components/ui/toaster";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// User Pages
import Home from "./pages/Home";
import RestaurantDetail from "./pages/RestaurantDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FirebaseDebugTool from "./pages/FirebaseDebugTool";
import AdminPasswordVerify from "./pages/AdminPasswordVerify";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSellerRequests from "./pages/admin/AdminSellerRequests";
import AdminPendingProducts from "./pages/admin/AdminPendingProducts";
import AdminSponsored from "./pages/admin/AdminSponsored";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminMenuItems from "./pages/admin/AdminMenuItems";
import AdminOrders from "./pages/admin/AdminOrders";

// Seller Pages
import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerRestaurants from "./pages/seller/SellerRestaurants";
import SellerMenuItems from "./pages/seller/SellerMenuItems";
import SellerPending from "./pages/seller/SellerPending";

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <NotificationProvider>
            <BrowserRouter>
              <div className="App">
                <Routes>
                  {/* Public Routes with Navbar and Footer */}
                  <Route
                    path="/"
                    element={
                      <>
                        <Navbar />
                        <Home />
                        <Footer />
                    </>
                  }
                />
                <Route
                  path="/restaurant/:id"
                  element={
                    <>
                      <Navbar />
                      <RestaurantDetail />
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <>
                      <Navbar />
                      <Cart />
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <>
                      <Navbar />
                      <Checkout />
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <>
                      <Navbar />
                      <Orders />
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <>
                      <Navbar />
                      <Profile />
                      <Footer />
                    </>
                  }
                />
                
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Admin Verification */}
                <Route path="/admin-verify" element={<AdminPasswordVerify />} />
                
                {/* Debug Tool */}
                <Route path="/debug" element={<FirebaseDebugTool />} />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminLayout />
                    </ProtectedAdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="seller-requests" element={<AdminSellerRequests />} />
                  <Route path="pending-products" element={<AdminPendingProducts />} />
                  <Route path="sponsored" element={<AdminSponsored />} />
                  <Route path="restaurants" element={<AdminRestaurants />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="menu-items" element={<AdminMenuItems />} />
                  <Route path="orders" element={<AdminOrders />} />
                </Route>

                {/* Seller Panel Routes */}
                <Route path="/seller" element={<SellerLayout />}>
                  <Route index element={<SellerDashboard />} />
                  <Route path="restaurants" element={<SellerRestaurants />} />
                  <Route path="menu-items" element={<SellerMenuItems />} />
                  <Route path="pending" element={<SellerPending />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
            </div>
          </BrowserRouter>
          </NotificationProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
