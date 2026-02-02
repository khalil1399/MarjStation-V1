import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Users, Store, Package, DollarSign, AlertCircle, CheckCircle, Info, UserCheck, FileCheck } from 'lucide-react';
import { testFirebaseConnection } from '../../utils/firebaseTest';
import { categoryService } from '../../services/firebase/categoryService';
import { restaurantService } from '../../services/firebase/restaurantService';
import { orderService } from '../../services/firebase/orderService';
import { userService } from '../../services/firebase/userService';
import { sellerRequestService } from '../../services/firebase/sellerRequestService';
import { sellerProductService } from '../../services/firebase/sellerProductService';

const AdminDashboard = () => {
  const [testing, setTesting] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    categories: 0,
    pendingSellerRequests: 0,
    pendingProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
    loadStats();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    const status = await testFirebaseConnection();
    setFirebaseStatus(status);
    setTesting(false);
    
    if (!status.canWrite) {
      console.error('⚠️ Firebase write permission denied!');
      console.log('📖 Please read /app/FIREBASE_SETUP_REQUIRED.md for setup instructions');
    }
  };

  const loadStats = async () => {
    try {
      const [users, restaurants, orders, categories, sellerRequests, pendingProducts] = await Promise.all([
        userService.getAllUsers(),
        restaurantService.getAllRestaurants(),
        orderService.getAllOrders(),
        categoryService.getAllCategories(),
        sellerRequestService.getAllSellerRequests(),
        sellerProductService.getAllPendingProducts()
      ]);
      
      const pendingRequests = sellerRequests.filter(req => req.status === 'pending');
      const pendingProductsCount = pendingProducts.filter(p => p.status === 'pending');
      
      setStats({
        users: users.length,
        restaurants: restaurants.length,
        orders: orders.length,
        categories: categories.length,
        pendingSellerRequests: pendingRequests.length,
        pendingProducts: pendingProductsCount.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { label: 'Restaurants', value: stats.restaurants, icon: Store, color: 'bg-green-500' },
    { label: 'Total Orders', value: stats.orders, icon: Package, color: 'bg-orange-500' },
    { label: 'Categories', value: stats.categories, icon: DollarSign, color: 'bg-purple-500' },
  ];

  const isEmpty = stats.restaurants === 0 && stats.categories === 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button
          onClick={testConnection}
          disabled={testing}
          variant="outline"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {/* Firebase Status Alert */}
      {firebaseStatus && (
        <div className="mb-6">
          {firebaseStatus.canWrite ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-1">✅ Firebase is connected and working!</div>
                <div className="text-sm">
                  Database URL: <code className="bg-green-100 px-2 py-1 rounded text-xs">{firebaseStatus.databaseURL}</code>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-semibold mb-2">❌ Firebase Configuration Issue!</div>
                <div className="text-sm space-y-1">
                  {firebaseStatus.databaseURL === 'NOT CONFIGURED' ? (
                    <div className="bg-red-100 p-2 rounded mb-2">
                      <strong>CRITICAL:</strong> Database URL is missing! Data cannot be saved without it.
                    </div>
                  ) : (
                    <>
                      <div>Status: Read: {firebaseStatus.canRead ? '✅' : '❌'} | Write: {firebaseStatus.canWrite ? '✅' : '❌'}</div>
                      <div>Database URL: <code className="bg-red-100 px-2 py-1 rounded text-xs">{firebaseStatus.databaseURL}</code></div>
                    </>
                  )}
                  {firebaseStatus.errors.map((error, index) => (
                    <div key={index} className="text-xs">• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Pending Seller Requests Alert */}
      {stats.pendingSellerRequests > 0 && !loading && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <UserCheck className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{stats.pendingSellerRequests} pending seller request{stats.pendingSellerRequests > 1 ? 's' : ''}</span>
                <span className="ml-2 text-sm">waiting for review</span>
              </div>
              <Button 
                size="sm" 
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={() => window.location.href = '/admin/seller-requests'}
              >
                Review Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Products Alert */}
      {stats.pendingProducts > 0 && !loading && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <FileCheck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{stats.pendingProducts} seller product{stats.pendingProducts > 1 ? 's' : ''}</span>
                <span className="ml-2 text-sm">awaiting review</span>
              </div>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/admin/pending-products'}
              >
                Review Products
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Getting Started Guide for Empty Database */}
      {isEmpty && !loading && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="font-semibold mb-2">Welcome! Here is how to get started:</div>
            <ol className="list-decimal ml-4 space-y-1 text-sm">
              <li>First, add categories (e.g., Fast Food, Pizza, etc.) in the <strong>Categories</strong> section</li>
              <li>Then, add restaurants in the <strong>Restaurants</strong> section</li>
              <li>Add menu items for each restaurant in <strong>Menu Items</strong></li>
              <li>Your customers can now browse and order!</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/seller-requests'}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Review Seller Requests
              {stats.pendingSellerRequests > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingSellerRequests}
                </span>
              )}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/pending-products'}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Review Seller Products
              {stats.pendingProducts > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingProducts}
                </span>
              )}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/categories'}
            >
              <Store className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/restaurants'}
            >
              <Store className="h-4 w-4 mr-2" />
              Manage Restaurants
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/menu-items'}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Menu Items
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Database Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Categories</span>
              <span className="font-semibold">{loading ? '...' : stats.categories}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Restaurants</span>
              <span className="font-semibold">{loading ? '...' : stats.restaurants}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-semibold">{loading ? '...' : stats.orders}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Registered Users</span>
              <span className="font-semibold">{loading ? '...' : stats.users}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
