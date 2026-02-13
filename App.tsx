import React, { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebaseConfig';
import PaymentGateway from './components/PaymentGateway';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login anonymously so the user can read/write to Firestore 
    // based on security rules without needing an account.
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <PaymentGateway />;
};

export default App;