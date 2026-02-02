import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const restaurantService = {
  // Create restaurant
  async createRestaurant(restaurantData) {
    try {
      console.log('🔄 Creating restaurant:', restaurantData.name);
      const restaurantsRef = ref(database, 'restaurants');
      const newRestaurantRef = push(restaurantsRef);
      
      const dataToSave = {
        ...restaurantData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📝 Writing to Firebase path:', newRestaurantRef.toString());
      await set(newRestaurantRef, dataToSave);
      
      console.log('✅ Restaurant created successfully with ID:', newRestaurantRef.key);
      return { success: true, id: newRestaurantRef.key };
    } catch (error) {
      console.error('❌ Error creating restaurant:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  // Get all restaurants (one-time)
  async getAllRestaurants() {
    try {
      const restaurantsRef = ref(database, 'restaurants');
      const snapshot = await get(restaurantsRef);
      if (snapshot.exists()) {
        const restaurants = [];
        snapshot.forEach((childSnapshot) => {
          restaurants.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return restaurants;
      }
      return [];
    } catch (error) {
      console.error('Error getting restaurants:', error);
      throw error;
    }
  },

  // Listen to restaurants in real-time
  listenToRestaurants(callback) {
    const restaurantsRef = ref(database, 'restaurants');
    const listener = onValue(restaurantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const restaurants = [];
        snapshot.forEach((childSnapshot) => {
          restaurants.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(restaurants);
      } else {
        callback([]);
      }
    });
    return () => off(restaurantsRef, 'value', listener);
  },

  // Get single restaurant
  async getRestaurant(restaurantId) {
    try {
      const restaurantRef = ref(database, `restaurants/${restaurantId}`);
      const snapshot = await get(restaurantRef);
      if (snapshot.exists()) {
        return { id: restaurantId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      throw error;
    }
  },

  // Listen to single restaurant
  listenToRestaurant(restaurantId, callback) {
    const restaurantRef = ref(database, `restaurants/${restaurantId}`);
    const listener = onValue(restaurantRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: restaurantId, ...snapshot.val() });
      } else {
        callback(null);
      }
    });
    return () => off(restaurantRef, 'value', listener);
  },

  // Update restaurant
  async updateRestaurant(restaurantId, updates) {
    try {
      console.log('🔄 Updating restaurant:', restaurantId);
      console.log('📝 Updates:', updates);
      const restaurantRef = ref(database, `restaurants/${restaurantId}`);
      
      const dataToUpdate = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(restaurantRef, dataToUpdate);
      console.log('✅ Restaurant updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating restaurant:', error);
      console.error('Error code:', error.code);
      throw error;
    }
  },

  // Delete restaurant
  async deleteRestaurant(restaurantId) {
    try {
      const restaurantRef = ref(database, `restaurants/${restaurantId}`);
      await remove(restaurantRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }
};
