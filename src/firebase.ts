import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAVMaWC8Suo7vCHli8ADqmUX2w5RGjvy0",
  authDomain: "car-wash-a59f4.firebaseapp.com",
  projectId: "car-wash-a59f4",
  storageBucket: "car-wash-a59f4.firebasestorage.app",
  messagingSenderId: "531289988815",
  appId: "1:531289988815:web:8b61331c906ba8e3dae1ba",
  measurementId: "G-E24ZPKRZRS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling to avoid WebSocket issues in some environments
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };
