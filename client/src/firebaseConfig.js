// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6nP33Zm_sDdBeO7GPsY_NXKaf4tDM8Qk",
  authDomain: "smash-e436b.firebaseapp.com",
  projectId: "smash-e436b",
  storageBucket: "smash-e436b.appspot.com",
  messagingSenderId: "518941322657",
  appId: "1:518941322657:web:f7f84a615146a316b82fe0",
  measurementId: "G-S95LX1GEBV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
