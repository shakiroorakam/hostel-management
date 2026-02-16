import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ⚠️ REPLACE with your Firebase project config
// Go to: https://console.firebase.google.com → Project Settings → Your apps → Config
const firebaseConfig = {
    apiKey: "AIzaSyCtekqqcjD_VRUR1x0yct-cmVqxEfO-WHE",
    authDomain: "hostel-management-66a0a.firebaseapp.com",
    projectId: "hostel-management-66a0a",
    storageBucket: "hostel-management-66a0a.firebasestorage.app",
    messagingSenderId: "690804271495",
    appId: "1:690804271495:web:2b4e0433d4430d889c4b22",
    measurementId: "G-090BPD575Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
