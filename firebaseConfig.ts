import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPMdYkoJC5NQZ9Q80lGZXx5P3AnZ-fUAg",
  authDomain: "princess-6c1cd.firebaseapp.com",
  projectId: "princess-6c1cd",
  storageBucket: "princess-6c1cd.firebasestorage.app",
  messagingSenderId: "473112782069",
  appId: "1:473112782069:web:a17e666e084f98efb711bc",
  measurementId: "G-PYGHGJ5M70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
