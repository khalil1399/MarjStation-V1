import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Store, Package, FileText, Home, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userService } from '../../services/firebase/userService';

const SellerLayout = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    } else {
      // Set loading to false if no user is logged in
      setLoading(false);
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile(currentUser.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking seller status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect if not a seller
  if (!userProfile?.isSeller) {
    return <Navigate to="/profile" replace />;
  }

  const navItems = [
    { path: '/seller', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/seller/restaurants', icon: Store, label: 'My Restaurants' },
    { path: '/seller/menu-items', icon: Package, label: 'Menu Items' },
    { path: '/seller/pending', icon: FileText, label: 'Pending Approval' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen fixed">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-green-600">Seller Panel</h2>
            <p className="text-sm text-gray-500 mt-1">{userProfile?.name || currentUser.email}</p>
          </div>
          <nav className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/seller' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={`seller-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            <div className="border-t mt-4 pt-4">
              <Link
                to="/"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                data-testid="seller-nav-home"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;
