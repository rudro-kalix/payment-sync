# Payment Verification Checkout (Web Dashboard)

This repository is the **web verification part** of a two-part payment monitoring system.

## Project architecture (2 parts)

### 1) Android Notification Collector (Part 1)
This Android app listens to device notifications and collects transaction alerts from payment providers.

GitHub (Part 1):
- https://github.com/rudro-kalix/android-notification-listener-main

### 2) Payment Verification Checkout (Part 2 — this repo)
This project is the web dashboard + verification API where users:
- choose payment method/sender,
- enter amount,
- submit Transaction ID,
- verify against Firestore transaction records.


## What this project does

- Frontend built with **React + Vite** for checkout/verification UI.
- Backend API in **Vercel Serverless Function** (`/api/verify-payment`).
- Uses **Firebase Admin SDK** to validate transactions from Firestore.
- Prevents duplicate verification using `transaction_claims`.


## Tech stack

- React 19
- TypeScript
- Vite
- Firebase (client + admin)
- Vercel Serverless Functions
- Firestore


## Repository structure

- `components/PaymentGateway.tsx` → main checkout + verification UI
- `api/verify-payment.ts` → verification endpoint
- `api/firebaseAdmin.ts` → Firebase Admin initialization for server runtime
- `firebaseConfig.ts` → frontend Firebase config
- `vercel.json` → routing/rewrites for API + SPA


## How verification works

1. User selects gateway/sender and amount in UI.
2. User enters `transactionId` and submits.
3. API validates input (`transactionId`, `amount`, `provider`).
4. API checks:
   - transaction is not already claimed,
   - transaction ID exists in `transactions`,
   - amount matches.
5. On success, API:
   - creates a claim document,
   - marks transaction as used,
   - writes verification log.


## Local setup

### Prerequisites
- Node.js 18+
- npm

### 1) Install dependencies
```bash
npm install
```

### 2) Create `.env.local`
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_LINES\n-----END PRIVATE KEY-----\n"
```

### 3) Run app locally
Frontend only:
```bash
npx vite --host 0.0.0.0 --port 3000
```

Frontend + local API server:
```bash
npm run dev
```

### 4) Production build check
```bash
npm run build
```


## Deploy on Vercel (from GitHub)

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add environment variables in Vercel:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Deploy.

Notes:
- API route is `api/verify-payment.ts`.
- Firebase Admin helper is inside `api/` (`api/firebaseAdmin.ts`) to ensure Vercel bundles it correctly.


## Related project link

If you are looking for the Android collector app (Part 1), use:
- https://github.com/rudro-kalix/android-notification-listener-main

