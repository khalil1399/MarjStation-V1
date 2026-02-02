import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const userService = {
  // Create or update user profile
  async createUserProfile(userId, userData) {
    try {
      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        ...userData,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Get user profile (one-time)
  async getUserProfile(userId) {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return { id: userId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Listen to user profile in real-time
  listenToUserProfile(userId, callback) {
    const userRef = ref(database, `users/${userId}`);
    const listener = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: userId, ...snapshot.val() });
      } else {
        callback(null);
      }
    });
    return () => off(userRef, 'value', listener);
  },

  // Get all users (admin - one-time)
  async getAllUsers() {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = [];
        snapshot.forEach((childSnapshot) => {
          users.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return users;
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Listen to all users in real-time (admin)
  listenToUsers(callback) {
    const usersRef = ref(database, 'users');
    const listener = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = [];
        snapshot.forEach((childSnapshot) => {
          users.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(users);
      } else {
        callback([]);
      }
    });
    return () => off(usersRef, 'value', listener);
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};
