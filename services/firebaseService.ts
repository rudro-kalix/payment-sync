import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { Transaction } from "../types";

// -----------------------------------------------------------
// IMPORTANT: REPLACE THIS WITH YOUR FIREBASE CONFIGURATION
// You can find this in Firebase Console -> Project Settings
// -----------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
// We initialize lazily or just at module level, but ensure we check config before use.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const syncTransactionToFirebase = async (transaction: Transaction): Promise<boolean> => {
  // validation check
  if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
    const msg = "Firebase not configured. Please edit services/firebaseService.ts with your actual Firebase config keys.";
    alert(msg); // Alert so it is visible on mobile device
    throw new Error("Missing Firebase Configuration");
  }

  try {
    console.log("Attempting to sync transaction to Firebase...", transaction.trxId);
    
    // Firestore cannot accept 'undefined' values.
    // We deep copy and jsonify to ensure a clean plain object.
    const cleanTransaction = JSON.parse(JSON.stringify(transaction));
    
    await addDoc(collection(db, 'transactions'), cleanTransaction);
    
    console.log("Transaction successfully written to Firestore!");
    return true;
  } catch (error) {
    console.error("Error writing to Firebase: ", error);
    throw error;
  }
};