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

// Existing types...
export interface Transaction {
  docId?: string;
  packageName: string;
  title: string;
  text: string;
  time: number;
  transactionId: string | null;
  amount: number | null;
  used?: boolean;
}
