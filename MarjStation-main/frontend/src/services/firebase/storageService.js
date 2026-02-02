import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../config/firebase';

export const storageService = {
  // Upload image and return URL
  async uploadImage(file, path) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, `${path}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, url: downloadURL, path: snapshot.ref.fullPath };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Delete image
  async deleteImage(imagePath) {
    try {
      const fileRef = storageRef(storage, imagePath);
      await deleteObject(fileRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Upload restaurant image
  async uploadRestaurantImage(file) {
    return this.uploadImage(file, 'restaurants');
  },

  // Upload menu item image
  async uploadMenuItemImage(file) {
    return this.uploadImage(file, 'menu-items');
  },

  // Upload category image
  async uploadCategoryImage(file) {
    return this.uploadImage(file, 'categories');
  },

  // Upload profile image
  async uploadProfileImage(file, userId) {
    return this.uploadImage(file, `profiles/${userId}`);
  }
};
