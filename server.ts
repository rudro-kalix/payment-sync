import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import handler from './api/verify-payment';

// 1. Load Environment Variables
dotenv.config(); // Load .env
dotenv.config({ path: '.env.local' }); // Load .env.local (overrides .env)

const app = express();
const PORT = 3001;

// 2. Middleware
app.use(cors() as express.RequestHandler);
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// 3. Health Check (to verify server is running)
app.get('/', (req, res) => {
  res.send('PayMonitor API Server is Running');
});

// 4. API Route
app.all('/api/verify-payment', async (req, res) => {
  try {
    // Adapt Express req/res to match the handler signature
    await handler(req as any, res as any);
  } catch (err: any) {
    console.error("[API Error]", err);
    // Ensure we return JSON even on crash
    res.status(500).json({ 
      ok: false, 
      code: 'server_error', 
      message: err.message || 'Internal Server Error' 
    });
  }
});

// 5. Startup Logic
const requiredEnv = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('\n\x1b[31m%s\x1b[0m', '-------------------------------------------------------');
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Missing Environment Variables');
  console.error('\x1b[31m%s\x1b[0m', `Missing: ${missingEnv.join(', ')}`);
  console.error('\x1b[33m%s\x1b[0m', 'Please rename .env.example to .env.local and fill in the values.');
  console.error('\x1b[31m%s\x1b[0m', '-------------------------------------------------------\n');
  // We do not exit process so the dev server stays alive, but API will fail.
}

app.listen(PORT, () => {
  console.log(`\n> API Server ready on http://localhost:${PORT}`);
  console.log(`> Proxy: http://localhost:3000/api -> http://localhost:3001/api\n`);
});