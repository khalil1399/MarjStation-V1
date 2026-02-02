import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const orderService = {
  // Create order
  async createOrder(orderData) {
    try {
      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);
      const orderId = 'ORD-' + Date.now();
      await set(newOrderRef, {
        orderId,
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: newOrderRef.key, orderId };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get all orders (one-time)
  async getAllOrders() {
    try {
      const ordersRef = ref(database, 'orders');
      const snapshot = await get(ordersRef);
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return [];
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  // Listen to all orders in real-time
  listenToOrders(callback) {
    const ordersRef = ref(database, 'orders');
    const listener = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        callback([]);
      }
    });
    return () => off(ordersRef, 'value', listener);
  },

  // Get orders by user (one-time)
  async getOrdersByUser(userId) {
    try {
      const ordersRef = ref(database, 'orders');
      const snapshot = await get(ordersRef);
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          const order = childSnapshot.val();
          if (order.userId === userId) {
            orders.push({ id: childSnapshot.key, ...order });
          }
        });
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return [];
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },

  // Listen to user orders in real-time
  listenToUserOrders(userId, callback) {
    const ordersRef = ref(database, 'orders');
    const listener = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          const order = childSnapshot.val();
          if (order.userId === userId) {
            orders.push({ id: childSnapshot.key, ...order });
          }
        });
        callback(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        callback([]);
      }
    });
    return () => off(ordersRef, 'value', listener);
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Delete order
  async deleteOrder(orderId) {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await remove(orderRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
};
