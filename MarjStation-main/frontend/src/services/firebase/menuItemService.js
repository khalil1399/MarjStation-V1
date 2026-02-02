import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const menuItemService = {
  // Create menu item
  async createMenuItem(menuItemData) {
    try {
      const menuItemsRef = ref(database, 'menuItems');
      const newMenuItemRef = push(menuItemsRef);
      await set(newMenuItemRef, {
        ...menuItemData,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: newMenuItemRef.key };
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  },

  // Get all menu items (one-time)
  async getAllMenuItems() {
    try {
      const menuItemsRef = ref(database, 'menuItems');
      const snapshot = await get(menuItemsRef);
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((childSnapshot) => {
          items.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return items;
      }
      return [];
    } catch (error) {
      console.error('Error getting menu items:', error);
      throw error;
    }
  },

  // Listen to all menu items in real-time
  listenToMenuItems(callback) {
    const menuItemsRef = ref(database, 'menuItems');
    const listener = onValue(menuItemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((childSnapshot) => {
          items.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(items);
      } else {
        callback([]);
      }
    });
    return () => off(menuItemsRef, 'value', listener);
  },

  // Get menu items by restaurant (one-time)
  async getMenuItemsByRestaurant(restaurantId) {
    try {
      const menuItemsRef = ref(database, 'menuItems');
      const snapshot = await get(menuItemsRef);
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();
          if (item.restaurantId === restaurantId) {
            items.push({ id: childSnapshot.key, ...item });
          }
        });
        return items;
      }
      return [];
    } catch (error) {
      console.error('Error getting menu items by restaurant:', error);
      throw error;
    }
  },

  // Listen to menu items by restaurant in real-time
  listenToMenuItemsByRestaurant(restaurantId, callback) {
    const menuItemsRef = ref(database, 'menuItems');
    const listener = onValue(menuItemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();
          if (item.restaurantId === restaurantId) {
            items.push({ id: childSnapshot.key, ...item });
          }
        });
        callback(items);
      } else {
        callback([]);
      }
    });
    return () => off(menuItemsRef, 'value', listener);
  },

  // Update menu item
  async updateMenuItem(menuItemId, updates) {
    try {
      const menuItemRef = ref(database, `menuItems/${menuItemId}`);
      await update(menuItemRef, updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  // Delete menu item
  async deleteMenuItem(menuItemId) {
    try {
      const menuItemRef = ref(database, `menuItems/${menuItemId}`);
      await remove(menuItemRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }
};
