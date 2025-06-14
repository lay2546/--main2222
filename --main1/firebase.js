import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

// 🔐 Firebase Config (Project: lay01-a0522)
const firebaseConfig = {
  apiKey: "AIzaSyBIpu7d1kC_sjKAp9yhA11_fr9HVGXkEJk",
  authDomain: "lay01-a0522.firebaseapp.com",
  databaseURL: "https://lay01-a0522-default-rtdb.firebaseio.com",
  projectId: "lay01-a0522",
  storageBucket: "lay01-a0522.firebasestorage.app",
  messagingSenderId: "22588227396",
  appId: "1:22588227396:web:401bc67445565eee67a111",
  measurementId: "G-ND7FX0KBJ9"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 📦 Core Services
export const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);

// 📊 Analytics (ใช้งานได้เฉพาะบน domain จริง)
const analytics = getAnalytics(app);

// 📤 Export สำหรับใช้งาน
export { app, storage, analytics };

