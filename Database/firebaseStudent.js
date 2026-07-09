// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1r9RbP88yMIICIuZOe8TPCMeavE3crSg",
  authDomain: "govverify-3453a.firebaseapp.com",
  projectId: "govverify-3453a",
  storageBucket: "govverify-3453a.firebasestorage.app",
  messagingSenderId: "982083233366",
  appId: "1:982083233366:web:5205b159a2d75527cdbdf7",
  measurementId: "G-KXQ0JYET9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, getDoc };
