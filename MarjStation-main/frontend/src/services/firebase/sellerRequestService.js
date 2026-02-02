import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const sellerRequestService = {
  // Create seller request
  async createSellerRequest(requestData) {
    try {
      const requestsRef = ref(database, 'sellerRequests');
      const newRequestRef = push(requestsRef);
      
      await set(newRequestRef, {
        ...requestData,
        status: 'pending',
        adminNotes: '',
        adminFeedback: '',
        requestDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Seller request created with ID:', newRequestRef.key);
      return { success: true, id: newRequestRef.key };
    } catch (error) {
      console.error('❌ Error creating seller request:', error);
      throw error;
    }
  },

  // Get seller request by ID
  async getSellerRequestById(requestId) {
    try {
      const requestRef = ref(database, `sellerRequests/${requestId}`);
      const snapshot = await get(requestRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error getting seller request:', error);
      throw error;
    }
  },

  // Get seller request by user ID
  async getSellerRequestByUserId(userId) {
    try {
      const requestsRef = ref(database, 'sellerRequests');
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        let userRequest = null;
        snapshot.forEach((childSnapshot) => {
          const request = childSnapshot.val();
          if (request.userId === userId) {
            userRequest = { id: childSnapshot.key, ...request };
          }
        });
        return userRequest;
      }
      return null;
    } catch (error) {
      console.error('Error getting seller request:', error);
      throw error;
    }
  },

  // Listen to user's seller request
  listenToUserSellerRequest(userId, callback) {
    const requestsRef = ref(database, 'sellerRequests');
    const listener = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        let userRequest = null;
        snapshot.forEach((childSnapshot) => {
          const request = childSnapshot.val();
          if (request.userId === userId) {
            userRequest = { id: childSnapshot.key, ...request };
          }
        });
        callback(userRequest);
      } else {
        callback(null);
      }
    });
    return () => off(requestsRef, 'value', listener);
  },

  // Get all seller requests (admin)
  async getAllSellerRequests() {
    try {
      const requestsRef = ref(database, 'sellerRequests');
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        const requests = [];
        snapshot.forEach((childSnapshot) => {
          requests.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return requests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
      }
      return [];
    } catch (error) {
      console.error('Error getting seller requests:', error);
      throw error;
    }
  },

  // Listen to all seller requests in real-time (admin)
  listenToSellerRequests(callback) {
    const requestsRef = ref(database, 'sellerRequests');
    const listener = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requests = [];
        snapshot.forEach((childSnapshot) => {
          requests.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(requests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)));
      } else {
        callback([]);
      }
    });
    return () => off(requestsRef, 'value', listener);
  },

  // Update seller request (admin can edit details)
  async updateSellerRequest(requestId, updateData) {
    try {
      const requestRef = ref(database, `sellerRequests/${requestId}`);
      await update(requestRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Seller request updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating seller request:', error);
      throw error;
    }
  },

  // Approve seller request with optional feedback
  async approveSellerRequest(requestId, userId, feedback = '') {
    try {
      // Update request status
      const requestRef = ref(database, `sellerRequests/${requestId}`);
      await update(requestRef, {
        status: 'approved',
        adminFeedback: feedback,
        approvedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update user to be a seller
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        isSeller: true,
        sellerApprovedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Seller request approved');
      return { success: true };
    } catch (error) {
      console.error('❌ Error approving seller request:', error);
      throw error;
    }
  },

  // Reject seller request with reason/feedback
  async rejectSellerRequest(requestId, reason = '') {
    try {
      const requestRef = ref(database, `sellerRequests/${requestId}`);
      await update(requestRef, {
        status: 'rejected',
        rejectionReason: reason,
        adminFeedback: reason,
        rejectedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Seller request rejected');
      return { success: true };
    } catch (error) {
      console.error('❌ Error rejecting seller request:', error);
      throw error;
    }
  },

  // Add/Update admin notes (internal tracking)
  async updateAdminNotes(requestId, notes) {
    try {
      const requestRef = ref(database, `sellerRequests/${requestId}`);
      await update(requestRef, {
        adminNotes: notes,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Admin notes updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating admin notes:', error);
      throw error;
    }
  },

  // Delete seller request
  async deleteSellerRequest(requestId) {
    try {
      const requestRef = ref(database, `sellerRequests/${requestId}`);
      await remove(requestRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting seller request:', error);
      throw error;
    }
  }
};
