import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Store, List, Package, LayoutDashboard, UserCheck, ShoppingBag, FileCheck, Sparkles } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/seller-requests', icon: UserCheck, label: 'Seller Requests' },
    { path: '/admin/pending-products', icon: FileCheck, label: 'Product Reviews' },
    { path: '/admin/sponsored', icon: Sparkles, label: 'Sponsored' },
    { path: '/admin/restaurants', icon: Store, label: 'Restaurants' },
    { path: '/admin/categories', icon: List, label: 'Categories' },
    { path: '/admin/menu-items', icon: Package, label: 'Menu Items' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-orange-600">Admin Panel</h2>
          </div>
          <nav className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    isActive
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
