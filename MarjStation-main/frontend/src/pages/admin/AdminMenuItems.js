import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, UtensilsCrossed } from 'lucide-react';
import { menuItemService } from '../../services/firebase/menuItemService';
import { restaurantService } from '../../services/firebase/restaurantService';

const AdminMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    restaurantId: '',
    name: '',
    description: '',
    price: 0,
    category: '',
    image: ''
  });

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribeMenuItems = menuItemService.listenToMenuItems((data) => {
      setMenuItems(data);
      setLoading(false);
    });

    const unsubscribeRestaurants = restaurantService.listenToRestaurants((data) => {
      setRestaurants(data);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeMenuItems();
      unsubscribeRestaurants();
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
    setSubmitting(true);
    
    try {
      if (editingItem) {
        await menuItemService.updateMenuItem(editingItem.id, formData);
        toast({ title: 'Menu item updated successfully' });
      } else {
        await menuItemService.createMenuItem(formData);
        toast({ title: 'Menu item created successfully' });
      }
      resetForm();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to ${editingItem ? 'update' : 'create'} menu item`,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      restaurantId: item.restaurantId,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image
    });
    setDialogOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await menuItemService.deleteMenuItem(itemId);
      toast({ title: 'Menu item deleted successfully' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete menu item',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      restaurantId: '',
      name: '',
      description: '',
      price: 0,
      category: '',
      image: ''
    });
    setEditingItem(null);
    setDialogOpen(false);
  };

  const filteredItems = selectedRestaurant === 'all'
    ? menuItems
    : menuItems.filter(item => item.restaurantId === selectedRestaurant);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu Items Management</h1>
        <div className="flex space-x-4">
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map(restaurant => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="restaurantId">Restaurant</Label>
                  <Select
                    value={formData.restaurantId}
                    onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.length > 0 ? (
                        restaurants.map(restaurant => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No restaurants available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {restaurants.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">Please add restaurants first in Restaurants section</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Burgers, Pizza"
                      disabled={submitting}
                    />
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
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingItem ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingItem ? 'Update' : 'Create'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedRestaurant === 'all' ? 'No Menu Items Yet' : 'No Items for This Restaurant'}
          </h3>
          <p className="text-gray-600 mb-6">
            {restaurants.length === 0 
              ? 'Please add restaurants first before adding menu items.'
              : 'Add menu items to populate your restaurant menus.'}
          </p>
          {restaurants.length > 0 && (
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Menu Item
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const restaurant = restaurants.find(r => r.id === item.restaurantId);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{restaurant?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminMenuItems;
