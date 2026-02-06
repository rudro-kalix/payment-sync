import { PaymentProvider } from "./types";

export const APP_VERSION = "1.0.2";

// Regex Patterns for Bangladesh Payment Gateways
// Note: These are approximations based on common formats.
export const PATTERNS = {
  [PaymentProvider.BKASH]: {
    // Example: You have received Tk 500.00 from 01700000000... TrxID 9G65H78J
    trxId: /TrxID\s+([A-Z0-9]+)/i,
    amount: /Tk\s+([\d,.]+)/i,
    sender: /from\s+(\d+)/i,
  },
  [PaymentProvider.NAGAD]: {
    // Example: Amount: Tk 500... TxnID: 7X889900
    trxId: /TxnID[:\s]+([A-Z0-9]+)/i,
    amount: /Amount[:\s]+Tk\s*([\d,.]+)/i,
    sender: /Sender[:\s]+(\d+)/i,
  },
  [PaymentProvider.ROCKET]: {
    // Example: ... Trans ID: 1234567890
    trxId: /Trans\s*ID[:\s]+([A-Z0-9]+)/i,
    amount: /Tk([\d,.]+)/i,
    sender: /from\s+(\d+)/i,
  }
};

// Dummy data for simulation
export const MOCK_SMS_MESSAGES = [
  "You have received Tk 1,500.00 from 01712345678. Ref: Bill. Fee Tk 0.00. Balance Tk 5000.00. TrxID 9H76K54L at 12/04/2024 10:30",
  "Money Received. Amount: Tk 2050. Sender: 01987654321. Ref: N/A. TxnID: 7X123999. Balance: Tk 3000.",
  "Tk5000 credited to your account from 01811223344. Trans ID: 8877665544. Rocket.",
  "Payment received of 500. Trx ID is MISSING-FORMAT-TEST." // To test AI fallback
];