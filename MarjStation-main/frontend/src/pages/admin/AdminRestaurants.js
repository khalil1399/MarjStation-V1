import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { restaurantService } from '../../services/firebase/restaurantService';
import { categoryService } from '../../services/firebase/categoryService';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    rating: 4.5,
    deliveryTime: '25-35 min',
    minOrder: 15,
    deliveryFee: 5,
    image: '',
    logo: '',
    isOpen: true
  });

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribeRestaurants = restaurantService.listenToRestaurants((data) => {
      setRestaurants(data);
      setLoading(false);
    });

    const unsubscribeCategories = categoryService.listenToCategories((data) => {
      setCategories(data);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRestaurants();
      unsubscribeCategories();
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate category is selected
    if (!formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category. Add categories first if none exist.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (editingRestaurant) {
        console.log('🔄 Updating restaurant ID:', editingRestaurant.id);
        await restaurantService.updateRestaurant(editingRestaurant.id, formData);
        toast({ 
          title: 'Success!',
          description: 'Restaurant updated successfully. Data saved to Firebase.',
        });
      } else {
        console.log('🔄 Creating new restaurant...');
        const result = await restaurantService.createRestaurant(formData);
        console.log('✅ Restaurant created with Firebase ID:', result.id);
        toast({ 
          title: 'Success!',
          description: `Restaurant created successfully! Firebase ID: ${result.id}`,
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('❌ Firebase Error:', error);
      toast({
        title: 'Firebase Error',
        description: `Failed to save: ${error.message}. Check Firebase Console rules.`,
        variant: 'destructive',
        duration: 10000
      });
    }
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData(restaurant);
    setDialogOpen(true);
  };

  const handleDelete = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await restaurantService.deleteRestaurant(restaurantId);
        toast({ title: 'Restaurant deleted successfully' });
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      rating: 4.5,
      deliveryTime: '25-35 min',
      minOrder: 15,
      deliveryFee: 5,
      image: '',
      logo: '',
      isOpen: true
    });
    setEditingRestaurant(null);
    setDialogOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurants Management</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No categories available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">Please add categories first in Categories section</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    required
                    placeholder="25-35 min"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrder">Min Order ($)</Label>
                  <Input
                    id="minOrder"
                    name="minOrder"
                    type="number"
                    value={formData.minOrder}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                  <Input
                    id="deliveryFee"
                    name="deliveryFee"
                    type="number"
                    value={formData.deliveryFee}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isOpen"
                  checked={formData.isOpen}
                  onCheckedChange={(checked) => setFormData({ ...formData, isOpen: checked })}
                />
                <Label htmlFor="isOpen">Restaurant is Open</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  {editingRestaurant ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
          <Card key={restaurant.id} className="overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{restaurant.description}</p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span>Rating: {restaurant.rating}</span>
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(restaurant)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(restaurant.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;
