import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Firestore } from 'firebase/firestore';
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

// Singleton instance to hold the database connection
let dbInstance: Firestore | null = null;

const getDb = (): Firestore => {
  // 1. Validation Check: Prevent initialization if keys are still default
  if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
    const msg = "Firebase configuration missing. Please edit services/firebaseService.ts.";
    console.error(msg);
    // We throw an error here so the UI can catch it and show 'Failed' status
    throw new Error("Missing Firebase Config");
  }

  // 2. Lazy Initialization: Only initialize if not already done
  if (!dbInstance) {
    try {
      const app = initializeApp(firebaseConfig);
      dbInstance = getFirestore(app);
    } catch (e) {
      console.error("Firebase Initialization Failed:", e);
      throw new Error("Firebase Init Failed");
    }
  }
  
  return dbInstance;
};

export const syncTransactionToFirebase = async (transaction: Transaction): Promise<boolean> => {
  try {
    const db = getDb(); // Initialize or get existing connection
    
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