import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, FolderOpen } from 'lucide-react';
import { categoryService } from '../../services/firebase/categoryService';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    image: ''
  });

  useEffect(() => {
    // Set up real-time listener for categories
    const unsubscribe = categoryService.listenToCategories((data) => {
      setCategories(data);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
        toast({ 
          title: 'Success!',
          description: 'Category updated successfully. Changes synced to Firebase.',
        });
      } else {
        const result = await categoryService.createCategory(formData);
        console.log('✅ Category created with ID:', result.id);
        toast({ 
          title: 'Success!',
          description: `Category created successfully! Firebase ID: ${result.id}`,
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('❌ Firebase Error:', error);
      toast({
        title: 'Firebase Error',
        description: `Failed to save: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      image: category.image
    });
    setDialogOpen(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(categoryId);
        toast({ title: 'Category deleted successfully' });
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
    setFormData({ name: '', icon: '', image: '' });
    setEditingCategory(null);
    setDialogOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="🍔"
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
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  {editingCategory ? 'Update' : 'Create'}
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
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h3>
          <p className="text-gray-600 mb-6">
            Categories help organize restaurants. Add your first category to get started!
          </p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Category
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-32 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="font-bold text-lg">{category.name}</h3>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(category.id)}
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

export default AdminCategories;
