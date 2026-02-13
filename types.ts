export interface Transaction {
  // Fields matching the Firestore screenshot
  docId?: string; 
  packageName: string;
  source?: string;
  
  title: string;       // Was notificationTitle
  text: string;        // Was notificationText
  time: number;        // Was timestamp
  
  transactionId: string | null;
  amount: number | null;
  
  // App logic fields
  id?: string;         // Firestore Document ID
  used?: boolean;      // Status field
}

export enum PackageName {
  BKASH = 'com.bKash.customerapp',
  NAGAD = 'com.kash.nagad',
  ROCKET = 'com.dbbl.mbs.apps.main',
}

export type AppName = 'bKash' | 'Nagad' | 'Rocket' | 'Unknown';

export interface FilterState {
  search: string;
  status: 'all' | 'used' | 'unused';
  app: 'all' | AppName;
  dateStart: string;
  dateEnd: string;
}

export type PaymentProvider = 'bkash' | 'nagad' | 'rocket';

export interface VerifyPaymentRequest {
  transactionId: string;
  amount: number;
  provider: PaymentProvider;
}

export interface VerifyPaymentResponse {
  ok: boolean;
  code: 'verified' | 'not_found' | 'amount_mismatch' | 'provider_mismatch' | 'already_used' | 'invalid_input' | 'server_error';
  message: string;
  data?: {
    transactionId: string;
    amount: number;
    provider: string;
    verifiedAt: string;
    matchedDocId: string;
  };
}