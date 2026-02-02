import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import { sellerProductService } from '../../services/firebase/sellerProductService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Package, 
  Clock, 
  CheckCircle,
  Info,
  Store
} from 'lucide-react';

const SellerMenuItems = () => {
  const { currentUser } = useAuth();
  const [liveMenuItems, setLiveMenuItems] = useState([]);
  const [liveRestaurants, setLiveRestaurants] = useState([]);
  const [pendingMenuItems, setPendingMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    restaurantId: '',
    restaurantName: '',
    category: '',
    isAvailable: true
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Set up listener for live products (both restaurants and menu items)
      const unsubscribeLive = sellerProductService.listenToSellerLiveProducts(
        currentUser.uid,
        (products) => {
          setLiveRestaurants(products.filter(p => p.productType === 'restaurant'));
          setLiveMenuItems(products.filter(p => p.productType === 'menuItem'));
        }
      );

      // Set up listener for pending products
      const unsubscribePending = sellerProductService.listenToSellerPendingProducts(
        currentUser.uid,
        (products) => {
          setPendingMenuItems(products.filter(p => 
            p.productType === 'menuItem' && p.status === 'pending'
          ));
        }
      );

      setLoading(false);

      return () => {
        unsubscribeLive();
        unsubscribePending();
      };
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'restaurantId') {
      const selectedRestaurant = liveRestaurants.find(r => r.id === value);
      setFormData({
        ...formData,
        restaurantId: value,
        restaurantName: selectedRestaurant?.name || ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      restaurantId: '',
      restaurantName: '',
      category: '',
      isAvailable: true
    });
    setEditingItem(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.restaurantId) {
      toast({
        title: 'Error',
        description: 'Please select a restaurant for this menu item.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        sellerId: currentUser.uid,
        sellerEmail: currentUser.email,
        productType: 'menuItem'
      };

      if (editingItem) {
        // Request edit for existing menu item
        await sellerProductService.requestProductEdit(
          editingItem.id,
          'menuItem',
          productData,
          currentUser.uid
        );
        toast({
          title: 'Edit request submitted',
          description: 'Your changes will be reviewed by an admin before going live.'
        });
      } else {
        // Create new pending menu item
        await sellerProductService.createPendingProduct(productData);
        toast({
          title: 'Menu item submitted',
          description: 'Your menu item will be reviewed by an admin before going live.'
        });
      }

      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      image: item.image || '',
      restaurantId: item.restaurantId || '',
      restaurantName: item.restaurantName || '',
      category: item.category || '',
      isAvailable: item.isAvailable !== false
    });
    setDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    if (!itemToDelete) return;
    
    setSubmitting(true);
    try {
      await sellerProductService.requestProductDeletion(
        itemToDelete.id,
        'menuItem',
        currentUser.uid,
        deleteReason
      );
      toast({
        title: 'Deletion request submitted',
        description: 'An admin will review your request to remove this menu item.'
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="seller-menu-items">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant menu items</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              disabled={liveRestaurants.length === 0}
              data-testid="add-menu-item-trigger"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Request Edit for Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  {editingItem 
                    ? 'Your edit request will be reviewed by an admin before changes go live.'
                    : 'New menu items require admin approval before becoming visible to customers.'}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="restaurantId">Restaurant *</Label>
                  <select
                    id="restaurantId"
                    name="restaurantId"
                    value={formData.restaurantId}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    data-testid="menu-item-restaurant-select"
                  >
                    <option value="">Select restaurant</option>
                    {liveRestaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter item name"
                    data-testid="menu-item-name-input"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Describe your menu item..."
                    data-testid="menu-item-description-input"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="9.99"
                    data-testid="menu-item-price-input"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Appetizers, Main Course"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={submitting}
                  data-testid="submit-menu-item-btn"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingItem ? 'Submit Edit Request' : 'Submit for Review'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* No Restaurants Warning */}
      {liveRestaurants.length === 0 && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You need at least one approved restaurant before you can add menu items.
            Please add a restaurant first and wait for admin approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Menu Items Section */}
      {pendingMenuItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Approval ({pendingMenuItems.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMenuItems.map((item) => (
              <Card key={item.id} className="p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{item.restaurantName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-green-600">{formatPrice(item.price)}</span>
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        {item.requestType === 'edit' ? 'Edit' : 
                         item.requestType === 'delete' ? 'Delete' : 'New'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live Menu Items Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Live Menu Items ({liveMenuItems.length})
        </h2>

        {liveMenuItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Menu Items</h3>
            <p className="text-gray-600 mb-4">
              {liveRestaurants.length === 0 
                ? 'Add a restaurant first, then you can add menu items.'
                : 'You have not added any menu items yet, or they are still pending approval.'}
            </p>
            {liveRestaurants.length > 0 && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Menu Item
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMenuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Store className="h-3 w-3" />
                    {item.restaurantName}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-green-600">{formatPrice(item.price)}</span>
                    {item.category && (
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(item)}
                      data-testid={`edit-menu-item-${item.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openDeleteDialog(item)}
                      data-testid={`delete-menu-item-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Request Menu Item Removal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <Info className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                This will submit a request to remove this menu item. An admin will review this request before the item is deleted.
              </AlertDescription>
            </Alert>
            <div>
              <Label>Item: {itemToDelete?.name}</Label>
              <p className="text-sm text-gray-500">{itemToDelete?.restaurantName}</p>
            </div>
            <div>
              <Label htmlFor="deleteReason">Reason for removal (optional)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Why do you want to remove this item?"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleDeleteRequest}
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Removal Request
              </Button>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerMenuItems;
