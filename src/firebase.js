import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config (replace with your actual values)
const firebaseConfig = {
    apiKey: "AIzaSyCicxEgmb9yfDUoKsjQrojTF4YLiJPXuJY",
    authDomain: "houswnew.firebaseapp.com",
    projectId: "houswnew",
    storageBucket: "houswnew.firebasestorage.app",
    messagingSenderId: "797709412624",
    appId: "1:797709412624:web:5858b1b2c6f408dcb39d95"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // For Step 3