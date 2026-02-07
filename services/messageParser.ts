import { PATTERNS } from "../constants";
import { ParsedData, PaymentProvider } from "../types";

export const parseMessage = (fullText: string, senderTitle?: string): ParsedData => {
  let bestMatch: ParsedData = {
    trxId: null,
    amount: null,
    sender: null,
    provider: PaymentProvider.UNKNOWN
  };

  const lowerText = fullText.toLowerCase();
  const lowerTitle = (senderTitle || "").toLowerCase();

  // 1. Detect Provider based on Title (App Name) or Body content
  if (lowerTitle.includes('bkash') || lowerText.includes('bkash')) {
      bestMatch.provider = PaymentProvider.BKASH;
  } else if (lowerTitle.includes('nagad') || lowerText.includes('nagad')) {
      bestMatch.provider = PaymentProvider.NAGAD;
  } else if (lowerTitle.includes('rocket') || lowerText.includes('rocket')) {
      bestMatch.provider = PaymentProvider.ROCKET;
  }
  
  // Fallback: Try patterns if provider unknown
  if (bestMatch.provider === PaymentProvider.UNKNOWN) {
    if (PATTERNS[PaymentProvider.BKASH].trxId.test(fullText)) bestMatch.provider = PaymentProvider.BKASH;
    else if (PATTERNS[PaymentProvider.NAGAD].trxId.test(fullText)) bestMatch.provider = PaymentProvider.NAGAD;
    else if (PATTERNS[PaymentProvider.ROCKET].trxId.test(fullText)) bestMatch.provider = PaymentProvider.ROCKET;
  }

  // 2. Extract Data
  if (bestMatch.provider !== PaymentProvider.UNKNOWN) {
    const rules = PATTERNS[bestMatch.provider];
    
    // Extract TrxID
    const trxMatch = fullText.match(rules.trxId);
    if (trxMatch && trxMatch[1]) bestMatch.trxId = trxMatch[1];

    // Extract Amount
    const amountMatch = fullText.match(rules.amount);
    if (amountMatch && amountMatch[1]) {
      bestMatch.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract Sender
    const senderMatch = fullText.match(rules.sender);
    if (senderMatch && senderMatch[1]) bestMatch.sender = senderMatch[1];
  }

  return bestMatch;
};