/**
 * Firebase Cloud Functions for HungerStation Notifications
 * 
 * These functions trigger push notifications based on database events.
 * Deploy using: firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.database();
const messaging = admin.messaging();

/**
 * Send notification to a specific user
 */
async function sendNotificationToUser(userId, notification) {
  try {
    // Get user's FCM token
    const tokenSnapshot = await db.ref(`fcmTokens/${userId}`).once("value");
    const tokenData = tokenSnapshot.val();
    
    if (!tokenData?.token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, error: "No token" };
    }

    // Check user preferences
    const prefsSnapshot = await db.ref(`notificationPreferences/${userId}`).once("value");
    const prefs = prefsSnapshot.val() || { enabled: true };

    if (!prefs.enabled) {
      console.log(`Notifications disabled for user ${userId}`);
      return { success: false, error: "Notifications disabled" };
    }

    // Send the notification
    const message = {
      token: tokenData.token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        type: notification.data?.type || "general",
        timestamp: new Date().toISOString(),
      },
      webpush: {
        notification: {
          icon: "/logo192.png",
          badge: "/logo192.png",
          requireInteraction: notification.requireInteraction || false,
        },
        fcmOptions: {
          link: notification.data?.url || "/",
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`Notification sent to user ${userId}:`, response);
    
    // Store notification in database for in-app display
    await db.ref(`notifications/${userId}`).push({
      title: notification.title,
      body: notification.body,
      type: notification.data?.type || "general",
      data: notification.data || {},
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { success: true, messageId: response };
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    
    // If token is invalid, remove it
    if (error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered") {
      await db.ref(`fcmTokens/${userId}`).remove();
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to all admin users
 */
async function notifyAdmins(notification) {
  const usersSnapshot = await db.ref("users").once("value");
  const promises = [];

  usersSnapshot.forEach((child) => {
    const user = child.val();
    if (user.role === "admin" || user.isAdmin) {
      promises.push(sendNotificationToUser(child.key, notification));
    }
  });

  return Promise.all(promises);
}

/**
 * Trigger: New Order Created
 * Notifies admin and relevant seller about new orders
 */
exports.onNewOrder = functions.database.ref("/orders/{orderId}")
  .onCreate(async (snapshot, context) => {
    const order = snapshot.val();
    const orderId = context.params.orderId;

    console.log(`New order created: ${orderId}`);

    // Notify admin
    await notifyAdmins({
      title: "New Order Received!",
      body: `Order #${orderId.slice(-6)} - $${order.total?.toFixed(2) || "0.00"}`,
      data: {
        type: "new_order",
        orderId: orderId,
        isAdmin: "true",
        url: "/admin/orders",
      },
    });

    // Notify customer
    if (order.userId) {
      await sendNotificationToUser(order.userId, {
        title: "Order Confirmed!",
        body: `Your order #${orderId.slice(-6)} has been received.`,
        data: {
          type: "order_confirmation",
          orderId: orderId,
          url: "/orders",
        },
      });
    }

    // If there are restaurant owners/sellers, notify them too
    if (order.restaurantId) {
      const restaurantSnapshot = await db.ref(`restaurants/${order.restaurantId}`).once("value");
      const restaurant = restaurantSnapshot.val();
      
      if (restaurant?.sellerId) {
        await sendNotificationToUser(restaurant.sellerId, {
          title: "New Order for Your Restaurant!",
          body: `Order #${orderId.slice(-6)} - $${order.total?.toFixed(2) || "0.00"}`,
          data: {
            type: "new_order",
            orderId: orderId,
            restaurantId: order.restaurantId,
            url: "/seller",
          },
        });
      }
    }

    return null;
  });

/**
 * Trigger: Order Status Update
 * Notifies customer when order status changes
 */
exports.onOrderStatusUpdate = functions.database.ref("/orders/{orderId}/status")
  .onUpdate(async (change, context) => {
    const newStatus = change.after.val();
    const previousStatus = change.before.val();
    const orderId = context.params.orderId;

    if (newStatus === previousStatus) return null;

    console.log(`Order ${orderId} status changed: ${previousStatus} -> ${newStatus}`);

    // Get the order to find the customer
    const orderSnapshot = await db.ref(`orders/${orderId}`).once("value");
    const order = orderSnapshot.val();

    if (!order?.userId) return null;

    const statusMessages = {
      confirmed: "Your order has been confirmed!",
      preparing: "Your order is being prepared!",
      ready: "Your order is ready for pickup/delivery!",
      "out-for-delivery": "Your order is out for delivery!",
      delivered: "Your order has been delivered!",
      cancelled: "Your order has been cancelled.",
    };

    const message = statusMessages[newStatus] || `Order status updated to: ${newStatus}`;

    await sendNotificationToUser(order.userId, {
      title: "Order Update",
      body: message,
      data: {
        type: "order_status",
        orderId: orderId,
        status: newStatus,
        url: "/orders",
      },
    });

    return null;
  });

/**
 * Trigger: New Seller Request
 * Notifies admins when a new seller account is requested
 */
exports.onNewSellerRequest = functions.database.ref("/sellerRequests/{requestId}")
  .onCreate(async (snapshot, context) => {
    const request = snapshot.val();
    const requestId = context.params.requestId;

    console.log(`New seller request: ${requestId}`);

    await notifyAdmins({
      title: "New Seller Request",
      body: `${request.businessName || "A user"} has requested a seller account.`,
      data: {
        type: "seller_request",
        requestId: requestId,
        url: "/admin/seller-requests",
      },
    });

    return null;
  });

/**
 * Trigger: Seller Request Status Update
 * Notifies user when their seller request is approved/rejected
 */
exports.onSellerRequestStatusUpdate = functions.database.ref("/sellerRequests/{requestId}/status")
  .onUpdate(async (change, context) => {
    const newStatus = change.after.val();
    const previousStatus = change.before.val();
    const requestId = context.params.requestId;

    if (newStatus === previousStatus || newStatus === "pending") return null;

    console.log(`Seller request ${requestId} status changed: ${previousStatus} -> ${newStatus}`);

    const requestSnapshot = await db.ref(`sellerRequests/${requestId}`).once("value");
    const request = requestSnapshot.val();

    if (!request?.userId) return null;

    const isApproved = newStatus === "approved";
    
    await sendNotificationToUser(request.userId, {
      title: isApproved ? "Seller Request Approved!" : "Seller Request Update",
      body: isApproved 
        ? "Congratulations! Your seller account has been approved. Start adding your products now!"
        : `Your seller request has been ${newStatus}. ${request.adminFeedback || ""}`.trim(),
      data: {
        type: "product_approval",
        requestId: requestId,
        status: newStatus,
        url: isApproved ? "/seller" : "/profile",
      },
    });

    return null;
  });

/**
 * Trigger: Pending Product Status Update
 * Notifies seller when their product is approved/rejected
 */
exports.onPendingProductStatusUpdate = functions.database.ref("/pendingProducts/{productId}/status")
  .onUpdate(async (change, context) => {
    const newStatus = change.after.val();
    const previousStatus = change.before.val();
    const productId = context.params.productId;

    if (newStatus === previousStatus || newStatus === "pending") return null;

    console.log(`Pending product ${productId} status changed: ${previousStatus} -> ${newStatus}`);

    const productSnapshot = await db.ref(`pendingProducts/${productId}`).once("value");
    const product = productSnapshot.val();

    if (!product?.sellerId) return null;

    const isApproved = newStatus === "approved";
    const productName = product.name || "Your product";
    
    await sendNotificationToUser(product.sellerId, {
      title: isApproved ? "Product Approved!" : "Product Review Update",
      body: isApproved 
        ? `"${productName}" has been approved and is now live!`
        : `"${productName}" was not approved. ${product.adminFeedback || ""}`.trim(),
      data: {
        type: "product_approval",
        productId: productId,
        status: newStatus,
        url: isApproved ? "/seller/restaurants" : "/seller/pending",
      },
    });

    return null;
  });

/**
 * Trigger: New Pending Product
 * Notifies admins when a seller submits a new product for review
 */
exports.onNewPendingProduct = functions.database.ref("/pendingProducts/{productId}")
  .onCreate(async (snapshot, context) => {
    const product = snapshot.val();
    const productId = context.params.productId;

    console.log(`New pending product: ${productId}`);

    const requestType = product.requestType || "new";
    const productType = product.productType === "restaurant" ? "restaurant" : "menu item";

    await notifyAdmins({
      title: "New Product Review Required",
      body: `${requestType === "new" ? "New" : requestType} ${productType}: "${product.name || "Unnamed"}"`,
      data: {
        type: "product_approval",
        productId: productId,
        url: "/admin/pending-products",
      },
    });

    return null;
  });

/**
 * Process notification queue (for client-triggered notifications)
 */
exports.processNotificationQueue = functions.database.ref("/notificationQueue/{notificationId}")
  .onCreate(async (snapshot, context) => {
    const queueItem = snapshot.val();
    const notificationId = context.params.notificationId;

    console.log(`Processing queued notification: ${notificationId}`);

    try {
      await sendNotificationToUser(queueItem.targetUserId, queueItem.notification);
      
      // Update status
      await snapshot.ref.update({
        status: "sent",
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      await snapshot.ref.update({
        status: "failed",
        error: error.message,
        failedAt: new Date().toISOString(),
      });
    }

    // Clean up old queue items (older than 24 hours)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const oldItems = await db.ref("notificationQueue")
      .orderByChild("createdAt")
      .endAt(new Date(cutoff).toISOString())
      .once("value");

    const deletePromises = [];
    oldItems.forEach((child) => {
      deletePromises.push(child.ref.remove());
    });
    await Promise.all(deletePromises);

    return null;
  });

/**
 * Scheduled function: Clean up old notifications (runs daily)
 */
exports.cleanupOldNotifications = functions.pubsub.schedule("0 0 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Running notification cleanup...");
    
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoffDate = new Date(cutoff).toISOString();
    
    const usersSnapshot = await db.ref("users").once("value");
    const cleanupPromises = [];

    usersSnapshot.forEach((userChild) => {
      const userId = userChild.key;
      cleanupPromises.push(
        db.ref(`notifications/${userId}`)
          .orderByChild("createdAt")
          .endAt(cutoffDate)
          .once("value")
          .then((notifs) => {
            const deletePromises = [];
            notifs.forEach((notif) => {
              deletePromises.push(notif.ref.remove());
            });
            return Promise.all(deletePromises);
          })
      );
    });

    await Promise.all(cleanupPromises);
    console.log("Notification cleanup complete");
    
    return null;
  });
