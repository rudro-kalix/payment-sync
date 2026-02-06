import { Transaction } from "../types";

// This is a MOCK implementation.
// In a real app, install: npm install firebase
// and configure initializeApp()

export const syncTransactionToFirebase = async (transaction: Transaction): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("Syncing to Firebase Firestore collection 'transactions':", {
    trx_id: transaction.trxId,
    amount: transaction.amount,
    provider: transaction.provider,
    timestamp: new Date(transaction.timestamp).toISOString()
  });

  // Random failure simulation for UI testing (10% chance)
  if (Math.random() < 0.1) {
    throw new Error("Network timeout connecting to Firebase");
  }

  return true;
};