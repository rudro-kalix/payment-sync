import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getAdminServices } from './firebaseAdmin.js';

// Define response types
type VerifyPaymentResponse = {
  ok: boolean;
  code:
    | 'verified'
    | 'not_found'
    | 'amount_mismatch'
    | 'provider_mismatch'
    | 'already_used'
    | 'invalid_input'
    | 'server_error';
  message: string;
  data?: {
    transactionId: string;
    amount: number;
    provider: string;
    matchedDocId: string;
    verifiedAt: string;
  };
};

const requestSchema = z.object({
  transactionId: z.string().min(3).trim(),
  amount: z.number().positive(),
  provider: z.enum(['bkash', 'nagad', 'rocket']),
});


function getClientIp(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  return forwarded || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Headers (Optional if frontend/backend on same domain, but good for safety)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      code: 'invalid_input',
      message: 'Method not allowed',
    } satisfies VerifyPaymentResponse);
  }

  let adminDb: ReturnType<typeof getAdminServices>['adminDb'] | null = null;
  let admin: ReturnType<typeof getAdminServices>['admin'] | null = null;

  try {
    // 2. Initialize Firebase (This will throw if ENV vars are missing)
    ({ adminDb, admin } = getAdminServices());

    // 3. Parse Body
    const parseResult = requestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_input',
        message: 'Invalid input parameters. check transactionId, amount, or provider.',
      } satisfies VerifyPaymentResponse);
    }

    const { transactionId, amount, provider } = parseResult.data;

    // 4. Run Transaction
    const result = await adminDb!.runTransaction(async (t) => {
      const claimRef = adminDb!.collection('transaction_claims').doc(transactionId);
      const claimDoc = await t.get(claimRef);

      if (claimDoc.exists) {
        throw new Error('ALREADY_USED');
      }

      const querySnapshot = await t.get(
        adminDb!.collection('notifications').where('transactionId', '==', transactionId).limit(10)
      );

      if (querySnapshot.empty) {
        throw new Error('NOT_FOUND');
      }

      let validDoc: any = null;
      let mismatchReason: 'amount' | null = null;

      for (const doc of querySnapshot.docs) {
        const data = doc.data();

        const dbAmount = Number(data.amount);
        if (Math.abs(dbAmount - amount) > 0.1) {
          mismatchReason = 'amount';
          continue;
        }

        validDoc = doc;
        break;
      }

      if (!validDoc) {
        if (mismatchReason === 'amount') throw new Error('AMOUNT_MISMATCH');
        throw new Error('NOT_FOUND');
      }

      // Update DB
      t.set(claimRef, {
        transactionId,
        verifiedAt: admin!.firestore.FieldValue.serverTimestamp(),
        amount,
        provider,
        originalDocId: validDoc.id,
        status: 'used',
      });

      t.update(validDoc.ref, {
        used: true,
        verifiedAt: admin!.firestore.FieldValue.serverTimestamp(),
        verifiedAmount: amount,
      });

      const logRef = adminDb!.collection('verification_logs').doc();
      t.set(logRef, {
        action: 'VERIFY_SUCCESS',
        transactionId,
        amount,
        provider,
        timestamp: admin!.firestore.FieldValue.serverTimestamp(),
        ip: getClientIp(req),
      });

      return {
        id: validDoc.id,
        verifiedAt: new Date().toISOString(),
      };
    });

    return res.status(200).json({
      ok: true,
      code: 'verified',
      message: 'Payment verified successfully',
      data: {
        transactionId,
        amount,
        provider,
        matchedDocId: result.id,
        verifiedAt: result.verifiedAt,
      },
    } satisfies VerifyPaymentResponse);

  } catch (error: any) {
    console.error('Verification Error:', error);

    let code: VerifyPaymentResponse['code'] = 'server_error';
    let message = 'Internal Server Error';
    let status = 500;

    const errorMessage = typeof error?.message === 'string' ? error.message : '';
    
    // Friendly error handling
    if (errorMessage.includes('FIREBASE_ENV_MISSING')) {
       message = 'Server configuration error: Missing Firebase Credentials.';
    } else if (errorMessage === 'ALREADY_USED') {
       code = 'already_used';
       message = 'This Transaction ID has already been verified.';
       status = 409;
    } else if (errorMessage === 'NOT_FOUND') {
       code = 'not_found';
       message = 'Transaction ID not found in our records.';
       status = 404;
    } else if (errorMessage === 'AMOUNT_MISMATCH') {
       code = 'amount_mismatch';
       message = 'The amount entered does not match the transaction record.';
       status = 400;
    }

    // Try to log failure to DB (fire and forget)
    try {
      if (adminDb && admin) {
        await adminDb.collection('verification_logs').add({
            action: 'VERIFY_FAILED',
            error: code,
            timestamp: admin!.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch {}

    return res.status(status).json({ ok: false, code, message } satisfies VerifyPaymentResponse);
  }
}
