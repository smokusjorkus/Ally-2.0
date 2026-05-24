import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // 1. Import this
import { getAuth } from "firebase/auth";
import { getAnalytics, initializeAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRzcdZsqQgUI_f-icMCxzIWPvSQsQfe64",
  authDomain: "ally-2-3936e.firebaseapp.com",
  databaseURL: "https://ally-2-3936e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ally-2-3936e",
  storageBucket: "ally-2-3936e.firebasestorage.app",
  messagingSenderId: "987902081832",
  appId: "1:987902081832:web:e4e4f1f6029d4fa1c66e1d",
  measurementId: "G-WTBQ81C80X"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig); // Export 'app' so other files can use it if needed
// Export Services
export const db = getFirestore(app);      // Keeps your existing Firestore working
export const database = getDatabase(app); // 3. Exports the new Realtime Database
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
