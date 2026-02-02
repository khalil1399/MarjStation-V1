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
import { categoryService } from '../../services/firebase/categoryService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Store, 
  Clock, 
  CheckCircle,
  Info,
  Eye
} from 'lucide-react';

const SellerRestaurants = () => {
  const { currentUser } = useAuth();
  const [liveRestaurants, setLiveRestaurants] = useState([]);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    image: '',
    category: '',
    deliveryTime: '30-45 min',
    rating: '4.5',
    minOrder: '10'
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Set up listeners
      const unsubscribeLive = sellerProductService.listenToSellerLiveProducts(
        currentUser.uid,
        (products) => {
          setLiveRestaurants(products.filter(p => p.productType === 'restaurant'));
        }
      );

      const unsubscribePending = sellerProductService.listenToSellerPendingProducts(
        currentUser.uid,
        (products) => {
          setPendingRestaurants(products.filter(p => 
            p.productType === 'restaurant' && p.status === 'pending'
          ));
        }
      );

      // Load categories
      const cats = await categoryService.getAllCategories();
      setCategories(cats);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      image: '',
      category: '',
      deliveryTime: '30-45 min',
      rating: '4.5',
      minOrder: '10'
    });
    setEditingRestaurant(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        sellerId: currentUser.uid,
        sellerEmail: currentUser.email,
        productType: 'restaurant'
      };

      if (editingRestaurant) {
        // Request edit for existing restaurant
        await sellerProductService.requestProductEdit(
          editingRestaurant.id,
          'restaurant',
          productData,
          currentUser.uid
        );
        toast({
          title: 'Edit request submitted',
          description: 'Your changes will be reviewed by an admin before going live.'
        });
      } else {
        // Create new pending restaurant
        await sellerProductService.createPendingProduct(productData);
        toast({
          title: 'Restaurant submitted',
          description: 'Your restaurant will be reviewed by an admin before going live.'
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

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      image: restaurant.image || '',
      category: restaurant.category || '',
      deliveryTime: restaurant.deliveryTime || '30-45 min',
      rating: restaurant.rating || '4.5',
      minOrder: restaurant.minOrder || '10'
    });
    setDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    if (!restaurantToDelete) return;
    
    setSubmitting(true);
    try {
      await sellerProductService.requestProductDeletion(
        restaurantToDelete.id,
        'restaurant',
        currentUser.uid,
        deleteReason
      );
      toast({
        title: 'Deletion request submitted',
        description: 'An admin will review your request to remove this restaurant.'
      });
      setDeleteDialogOpen(false);
      setRestaurantToDelete(null);
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

  const openDeleteDialog = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="seller-restaurants">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Restaurants</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant listings</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="add-restaurant-trigger">
              <Plus className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRestaurant ? 'Request Edit for Restaurant' : 'Add New Restaurant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  {editingRestaurant 
                    ? 'Your edit request will be reviewed by an admin before changes go live.'
                    : 'New restaurants require admin approval before becoming visible to customers.'}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter restaurant name"
                    data-testid="restaurant-name-input"
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
                    placeholder="Describe your restaurant..."
                    data-testid="restaurant-description-input"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    data-testid="restaurant-category-select"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    placeholder="30-45 min"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={2}
                    placeholder="Full restaurant address"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="minOrder">Minimum Order ($)</Label>
                  <Input
                    id="minOrder"
                    name="minOrder"
                    type="number"
                    value={formData.minOrder}
                    onChange={handleInputChange}
                    placeholder="10"
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
                  data-testid="submit-restaurant-btn"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRestaurant ? 'Submit Edit Request' : 'Submit for Review'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Restaurants Section */}
      {pendingRestaurants.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Approval ({pendingRestaurants.length})
          </h2>
          <div className="grid gap-4">
            {pendingRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {restaurant.image ? (
                        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{restaurant.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {restaurant.requestType === 'edit' ? 'Edit Pending' : 
                           restaurant.requestType === 'delete' ? 'Delete Pending' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live Restaurants Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Live Restaurants ({liveRestaurants.length})
        </h2>

        {liveRestaurants.length === 0 ? (
          <Card className="p-12 text-center">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Restaurants</h3>
            <p className="text-gray-600 mb-4">
              You have not added any restaurants yet, or they are still pending approval.
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Restaurant
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {liveRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {restaurant.image ? (
                        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 max-w-md">{restaurant.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        {restaurant.category && (
                          <Badge variant="outline">{restaurant.category}</Badge>
                        )}
                        {restaurant.deliveryTime && (
                          <span>{restaurant.deliveryTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(restaurant)}
                      data-testid={`edit-restaurant-${restaurant.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(restaurant)}
                      data-testid={`delete-restaurant-${restaurant.id}`}
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
            <DialogTitle className="text-red-600">Request Restaurant Removal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <Info className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                This will submit a request to remove your restaurant. An admin will review this request before the restaurant is deleted.
              </AlertDescription>
            </Alert>
            <div>
              <Label>Restaurant: {restaurantToDelete?.name}</Label>
            </div>
            <div>
              <Label htmlFor="deleteReason">Reason for removal (optional)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Why do you want to remove this restaurant?"
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

export default SellerRestaurants;
