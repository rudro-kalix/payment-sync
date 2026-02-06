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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const syncTransactionToFirebase = async (transaction: Transaction): Promise<boolean> => {
  try {
    console.log("Attempting to sync transaction to Firebase...", transaction.trxId);
    
    // Firestore cannot accept 'undefined' values, and custom class instances might cause issues.
    // We deep copy and jsonify to ensure a clean plain object.
    const cleanTransaction = JSON.parse(JSON.stringify(transaction));
    
    await addDoc(collection(db, 'transactions'), cleanTransaction);
    
    console.log("Transaction successfully written to Firestore!");
    return true;
  } catch (error) {
    console.error("Error writing to Firebase: ", error);
    // We re-throw the error so the UI can update the status to 'Failed'
    throw error;
  }
};