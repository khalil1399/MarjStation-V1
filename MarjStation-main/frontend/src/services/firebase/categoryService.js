import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const categoryService = {
  // Create category
  async createCategory(categoryData) {
    try {
      const categoriesRef = ref(database, 'categories');
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, {
        ...categoryData,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: newCategoryRef.key };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Get all categories (one-time)
  async getAllCategories() {
    try {
      const categoriesRef = ref(database, 'categories');
      const snapshot = await get(categoriesRef);
      if (snapshot.exists()) {
        const categories = [];
        snapshot.forEach((childSnapshot) => {
          categories.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return categories;
      }
      return [];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  // Listen to categories in real-time
  listenToCategories(callback) {
    const categoriesRef = ref(database, 'categories');
    const listener = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const categories = [];
        snapshot.forEach((childSnapshot) => {
          categories.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(categories);
      } else {
        callback([]);
      }
    });
    return () => off(categoriesRef, 'value', listener);
  },

  // Update category
  async updateCategory(categoryId, updates) {
    try {
      const categoryRef = ref(database, `categories/${categoryId}`);
      await update(categoryRef, updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(categoryId) {
    try {
      const categoryRef = ref(database, `categories/${categoryId}`);
      await remove(categoryRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};
