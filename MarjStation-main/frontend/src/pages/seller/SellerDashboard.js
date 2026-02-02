import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/firebase/userService';
import { sellerProductService } from '../../services/firebase/sellerProductService';
import { Store, Package, Clock, CheckCircle, XCircle, Plus, Info, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SellerDashboard = () => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    liveRestaurants: 0,
    liveMenuItems: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0
  });
  const [recentPending, setRecentPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [profile, liveProducts, pendingProducts] = await Promise.all([
        userService.getUserProfile(currentUser.uid),
        sellerProductService.getSellerLiveProducts(currentUser.uid),
        sellerProductService.getPendingProductsBySeller(currentUser.uid)
      ]);

      setUserProfile(profile);

      const restaurants = liveProducts.filter(p => p.productType === 'restaurant');
      const menuItems = liveProducts.filter(p => p.productType === 'menuItem');
      const pending = pendingProducts.filter(p => p.status === 'pending');
      const approved = pendingProducts.filter(p => p.status === 'approved');
      const rejected = pendingProducts.filter(p => p.status === 'rejected');

      setStats({
        liveRestaurants: restaurants.length,
        liveMenuItems: menuItems.length,
        pendingProducts: pending.length,
        approvedProducts: approved.length,
        rejectedProducts: rejected.length
      });

      setRecentPending(pending.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="seller-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile?.name || 'Seller'}!</h1>
        <p className="text-gray-600 mt-1">Manage your products and track your submissions</p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          All new products and changes require admin approval before going live. You can track the status of your submissions in the Pending Approval section.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Live Restaurants</p>
              <p className="text-2xl font-bold text-green-600">{stats.liveRestaurants}</p>
            </div>
            <Store className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Live Menu Items</p>
              <p className="text-2xl font-bold text-blue-600">{stats.liveMenuItems}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingProducts}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.approvedProducts}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedProducts}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/seller/restaurants">
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700" data-testid="add-restaurant-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add New Restaurant
              </Button>
            </Link>
            <Link to="/seller/menu-items">
              <Button className="w-full justify-start" variant="outline" data-testid="add-menu-item-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add New Menu Item
              </Button>
            </Link>
            <Link to="/seller/pending">
              <Button className="w-full justify-start" variant="outline" data-testid="view-pending-btn">
                <Clock className="h-4 w-4 mr-2" />
                View Pending Submissions
                {stats.pendingProducts > 0 && (
                  <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.pendingProducts}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Pending */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
          {recentPending.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No pending submissions</p>
              <p className="text-sm mt-1">Add a new product to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {item.productType === 'restaurant' ? (
                      <Store className="h-5 w-5 text-green-600" />
                    ) : (
                      <Package className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.requestType === 'edit' ? 'Edit Request' : 
                         item.requestType === 'delete' ? 'Delete Request' : 'New'} • {formatDate(item.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
              ))}
              {stats.pendingProducts > 5 && (
                <Link to="/seller/pending" className="block text-center text-green-600 hover:text-green-700 text-sm font-medium">
                  View all {stats.pendingProducts} pending items →
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
