import { PATTERNS } from "../constants";
import { ParsedData, PaymentProvider } from "../types";

export const parseSms = (text: string): ParsedData => {
  let bestMatch: ParsedData = {
    trxId: null,
    amount: null,
    sender: null,
    provider: PaymentProvider.UNKNOWN
  };

  // 1. Detect Provider
  const lowerText = text.toLowerCase();
  if (lowerText.includes('bkash')) bestMatch.provider = PaymentProvider.BKASH;
  else if (lowerText.includes('nagad')) bestMatch.provider = PaymentProvider.NAGAD;
  else if (lowerText.includes('rocket') || lowerText.includes('dbbl')) bestMatch.provider = PaymentProvider.ROCKET;
  
  // If provider not found by name, try to match TrxID patterns to guess
  if (bestMatch.provider === PaymentProvider.UNKNOWN) {
    if (PATTERNS[PaymentProvider.BKASH].trxId.test(text)) bestMatch.provider = PaymentProvider.BKASH;
    else if (PATTERNS[PaymentProvider.NAGAD].trxId.test(text)) bestMatch.provider = PaymentProvider.NAGAD;
    else if (PATTERNS[PaymentProvider.ROCKET].trxId.test(text)) bestMatch.provider = PaymentProvider.ROCKET;
  }

  // 2. Extract Data based on Provider
  if (bestMatch.provider !== PaymentProvider.UNKNOWN) {
    const rules = PATTERNS[bestMatch.provider];
    
    // Extract TrxID
    const trxMatch = text.match(rules.trxId);
    if (trxMatch && trxMatch[1]) bestMatch.trxId = trxMatch[1];

    // Extract Amount
    const amountMatch = text.match(rules.amount);
    if (amountMatch && amountMatch[1]) {
      bestMatch.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract Sender
    const senderMatch = text.match(rules.sender);
    if (senderMatch && senderMatch[1]) bestMatch.sender = senderMatch[1];
  }

  return bestMatch;
};