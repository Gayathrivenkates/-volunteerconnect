// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCR-vEupwJOjDs1oNJ3Q229KX3V9bo40vo",
  authDomain: "volunteerhub-fc5be.firebaseapp.com",
  databaseURL: "https://volunteerhub-fc5be-default-rtdb.firebaseio.com", // ✅ Add this line
  projectId: "volunteerhub-fc5be",
  storageBucket: "volunteerhub-fc5be.appspot.com",
  messagingSenderId: "517069715009",
  appId: "1:517069715009:web:f91c9bc5181723bdd1f8c0",
  measurementId: "G-TVRGGGQ7KX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // <- Make sure this is correct
export const realtimeDB = getDatabase(app);
