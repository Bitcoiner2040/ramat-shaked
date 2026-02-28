import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Auth() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('שגיאה: הדומיין אינו מורשה. יש להוסיף את הדומיין במסוף Firebase.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('ההתחברות בוטלה על ידי המשתמש.');
      } else {
        setError('שגיאה בהתחברות עם Google. אנא נסה שנית.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-cyan-600 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            ברוכים הבאים
          </h2>
          <p className="text-cyan-100">
            התחבר כדי להזמין תור ולצבור נקודות
          </p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            התחבר עם Google
          </button>
        </div>
      </div>
    </div>
  );
}
