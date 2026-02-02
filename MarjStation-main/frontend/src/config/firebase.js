import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBYddCdbD2MGG4Z56AR15UjVlkrMR64q4o",
  authDomain: "marjstation-49e10.firebaseapp.com",
  databaseURL: "https://marjstation-49e10-default-rtdb.firebaseio.com",
  projectId: "marjstation-49e10",
  storageBucket: "marjstation-49e10.firebasestorage.app",
  messagingSenderId: "838144781266",
  appId: "1:838144781266:web:94bb3df0c4f0c79122b60b",
  measurementId: "G-2XWHBBZQR3"
};

// VAPID key for FCM web push
export const VAPID_KEY = "BEeSyVzVrGFy83e-TTzN7kKkccf3xIsqW8U5E1uXOK7RbNOPIk_ppDdqu4GUUxgIRX8BzYkVy_FMjLVGHCKP5gY";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Initialize messaging only if supported
let messaging = null;
isSupported().then(supported => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported && !messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
};

export default app;
