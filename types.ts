export enum PaymentProvider {
  BKASH = 'bKash',
  NAGAD = 'Nagad',
  ROCKET = 'Rocket',
  UNKNOWN = 'Unknown'
}

export interface Transaction {
  id: string; // Internal UUID
  rawSms: string;
  trxId: string | null;
  amount: number | null;
  sender: string | null;
  provider: PaymentProvider;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed' | 'manual_review';
  syncError?: string;
  isAiParsed?: boolean;
}

export interface ParsedData {
  trxId: string | null;
  amount: number | null;
  sender: string | null;
  provider: PaymentProvider;
}