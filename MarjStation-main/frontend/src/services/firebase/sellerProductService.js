import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const sellerProductService = {
  // Create a pending product (restaurant or menu item) submitted by seller
  async createPendingProduct(productData) {
    try {
      const productsRef = ref(database, 'pendingProducts');
      const newProductRef = push(productsRef);
      
      await set(newProductRef, {
        ...productData,
        status: 'pending',
        adminNotes: '',
        adminFeedback: '',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Pending product created with ID:', newProductRef.key);
      return { success: true, id: newProductRef.key };
    } catch (error) {
      console.error('❌ Error creating pending product:', error);
      throw error;
    }
  },

  // Get all pending products (admin)
  async getAllPendingProducts() {
    try {
      const productsRef = ref(database, 'pendingProducts');
      const snapshot = await get(productsRef);
      
      if (snapshot.exists()) {
        const products = [];
        snapshot.forEach((childSnapshot) => {
          products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return products.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      }
      return [];
    } catch (error) {
      console.error('Error getting pending products:', error);
      throw error;
    }
  },

  // Listen to all pending products (admin)
  listenToPendingProducts(callback) {
    const productsRef = ref(database, 'pendingProducts');
    const listener = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const products = [];
        snapshot.forEach((childSnapshot) => {
          products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(products.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      } else {
        callback([]);
      }
    });
    return () => off(productsRef, 'value', listener);
  },

  // Get pending products by seller
  async getPendingProductsBySeller(sellerId) {
    try {
      const productsRef = ref(database, 'pendingProducts');
      const snapshot = await get(productsRef);
      
      if (snapshot.exists()) {
        const products = [];
        snapshot.forEach((childSnapshot) => {
          const product = childSnapshot.val();
          if (product.sellerId === sellerId) {
            products.push({ id: childSnapshot.key, ...product });
          }
        });
        return products.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      }
      return [];
    } catch (error) {
      console.error('Error getting seller pending products:', error);
      throw error;
    }
  },

  // Listen to pending products by seller
  listenToSellerPendingProducts(sellerId, callback) {
    const productsRef = ref(database, 'pendingProducts');
    const listener = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const products = [];
        snapshot.forEach((childSnapshot) => {
          const product = childSnapshot.val();
          if (product.sellerId === sellerId) {
            products.push({ id: childSnapshot.key, ...product });
          }
        });
        callback(products.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      } else {
        callback([]);
      }
    });
    return () => off(productsRef, 'value', listener);
  },

  // Update pending product
  async updatePendingProduct(productId, updateData) {
    try {
      const productRef = ref(database, `pendingProducts/${productId}`);
      await update(productRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Pending product updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating pending product:', error);
      throw error;
    }
  },

  // Approve product and move to live collection
  async approveProduct(productId, feedback = '') {
    try {
      // Get the pending product
      const productRef = ref(database, `pendingProducts/${productId}`);
      const snapshot = await get(productRef);
      
      if (!snapshot.exists()) {
        throw new Error('Product not found');
      }
      
      const productData = snapshot.val();
      const { status, adminNotes, adminFeedback, submittedAt, updatedAt, ...cleanData } = productData;
      
      // Determine target collection based on product type
      const targetCollection = productData.productType === 'restaurant' ? 'restaurants' : 'menuItems';
      const targetRef = ref(database, targetCollection);
      const newRef = push(targetRef);
      
      // Add to live collection
      await set(newRef, {
        ...cleanData,
        isSellerProduct: true,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Update pending product status
      await update(productRef, {
        status: 'approved',
        adminFeedback: feedback,
        liveProductId: newRef.key,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Product approved and moved to:', targetCollection);
      return { success: true, liveProductId: newRef.key };
    } catch (error) {
      console.error('❌ Error approving product:', error);
      throw error;
    }
  },

  // Reject product
  async rejectProduct(productId, reason = '') {
    try {
      const productRef = ref(database, `pendingProducts/${productId}`);
      await update(productRef, {
        status: 'rejected',
        adminFeedback: reason,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Product rejected');
      return { success: true };
    } catch (error) {
      console.error('❌ Error rejecting product:', error);
      throw error;
    }
  },

  // Delete pending product
  async deletePendingProduct(productId) {
    try {
      const productRef = ref(database, `pendingProducts/${productId}`);
      await remove(productRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting pending product:', error);
      throw error;
    }
  },

  // Get seller's live products (approved restaurants and menu items)
  async getSellerLiveProducts(sellerId) {
    try {
      const [restaurantsSnapshot, menuItemsSnapshot] = await Promise.all([
        get(ref(database, 'restaurants')),
        get(ref(database, 'menuItems'))
      ]);
      
      const products = [];
      
      if (restaurantsSnapshot.exists()) {
        restaurantsSnapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();
          if (item.sellerId === sellerId) {
            products.push({ 
              id: childSnapshot.key, 
              ...item, 
              productType: 'restaurant' 
            });
          }
        });
      }
      
      if (menuItemsSnapshot.exists()) {
        menuItemsSnapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();
          if (item.sellerId === sellerId) {
            products.push({ 
              id: childSnapshot.key, 
              ...item, 
              productType: 'menuItem' 
            });
          }
        });
      }
      
      return products;
    } catch (error) {
      console.error('Error getting seller live products:', error);
      throw error;
    }
  },

  // Listen to seller's live products
  listenToSellerLiveProducts(sellerId, callback) {
    const restaurantsRef = ref(database, 'restaurants');
    const menuItemsRef = ref(database, 'menuItems');
    
    let restaurants = [];
    let menuItems = [];
    
    const updateCallback = () => {
      callback([...restaurants, ...menuItems]);
    };
    
    const restaurantListener = onValue(restaurantsRef, (snapshot) => {
      restaurants = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();
          if (item.sellerId === sellerId) {
            restaurants.push({ 
              id: childSnapshot.key, 
              ...item, 
              productType: 'restaurant' 
            });
          }
        });
      }
      updateCallback();
    });
    
    const menuItemListener = onValue(menuItemsRef, (snapshot) => {
      menuItems = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const item = childSnapshot.val();
          if (item.sellerId === sellerId) {
            menuItems.push({ 
              id: childSnapshot.key, 
              ...item, 
              productType: 'menuItem' 
            });
          }
        });
      }
      updateCallback();
    });
    
    return () => {
      off(restaurantsRef, 'value', restaurantListener);
      off(menuItemsRef, 'value', menuItemListener);
    };
  },

  // Request edit for live product (creates pending edit request)
  async requestProductEdit(productId, productType, editData, sellerId) {
    try {
      const productsRef = ref(database, 'pendingProducts');
      const newProductRef = push(productsRef);
      
      await set(newProductRef, {
        ...editData,
        originalProductId: productId,
        productType,
        sellerId,
        requestType: 'edit',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Edit request created');
      return { success: true, id: newProductRef.key };
    } catch (error) {
      console.error('❌ Error creating edit request:', error);
      throw error;
    }
  },

  // Request deletion for live product
  async requestProductDeletion(productId, productType, sellerId, reason = '') {
    try {
      const productsRef = ref(database, 'pendingProducts');
      const newProductRef = push(productsRef);
      
      await set(newProductRef, {
        originalProductId: productId,
        productType,
        sellerId,
        requestType: 'delete',
        deletionReason: reason,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Deletion request created');
      return { success: true, id: newProductRef.key };
    } catch (error) {
      console.error('❌ Error creating deletion request:', error);
      throw error;
    }
  },

  // Approve edit request
  async approveEditRequest(pendingId, feedback = '') {
    try {
      const pendingRef = ref(database, `pendingProducts/${pendingId}`);
      const snapshot = await get(pendingRef);
      
      if (!snapshot.exists()) {
        throw new Error('Edit request not found');
      }
      
      const requestData = snapshot.val();
      const { status, adminNotes, adminFeedback, submittedAt, updatedAt, requestType, originalProductId, productType, sellerId, ...editData } = requestData;
      
      // Update the live product
      const targetCollection = productType === 'restaurant' ? 'restaurants' : 'menuItems';
      const productRef = ref(database, `${targetCollection}/${originalProductId}`);
      
      await update(productRef, {
        ...editData,
        updatedAt: new Date().toISOString()
      });
      
      // Update pending request status
      await update(pendingRef, {
        status: 'approved',
        adminFeedback: feedback,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Edit request approved');
      return { success: true };
    } catch (error) {
      console.error('❌ Error approving edit request:', error);
      throw error;
    }
  },

  // Approve deletion request
  async approveDeletionRequest(pendingId, feedback = '') {
    try {
      const pendingRef = ref(database, `pendingProducts/${pendingId}`);
      const snapshot = await get(pendingRef);
      
      if (!snapshot.exists()) {
        throw new Error('Deletion request not found');
      }
      
      const requestData = snapshot.val();
      const { originalProductId, productType } = requestData;
      
      // Delete the live product
      const targetCollection = productType === 'restaurant' ? 'restaurants' : 'menuItems';
      const productRef = ref(database, `${targetCollection}/${originalProductId}`);
      await remove(productRef);
      
      // Update pending request status
      await update(pendingRef, {
        status: 'approved',
        adminFeedback: feedback,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Deletion request approved');
      return { success: true };
    } catch (error) {
      console.error('❌ Error approving deletion request:', error);
      throw error;
    }
  }
};
