import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export function AuthModal() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPreviewUser } = useGame();
  const { t } = useLanguage();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!auth || !isFirebaseConfigured) {
      setErrorMsg(t('auth.noFirebase'));
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg(t('auth.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t('auth.passwordShort'));
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
           setErrorMsg(t('auth.nameRequired'));
           return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: name,
          email: email,
          totalFragments: 0,
          completedModes: {}
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Automatis tertutup jika onAuthStateChanged di GameContext mendeteksi user
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case 'auth/invalid-email':
          setErrorMsg(t('auth.invalidEmail'));
          break;
        case 'auth/user-not-found':
          setErrorMsg(t('auth.userNotFound'));
          break;
        case 'auth/wrong-password':
          setErrorMsg(t('auth.wrongPassword'));
          break;
        case 'auth/invalid-credential':
          setErrorMsg(t('auth.invalidCredential'));
          break;
        case 'auth/email-already-in-use':
          setErrorMsg(t('auth.emailInUse'));
          break;
        case 'auth/operation-not-allowed':
          setErrorMsg(t('auth.operationNotAllowed'));
          break;
        case 'auth/weak-password':
          setErrorMsg(t('auth.weakPassword'));
          break;
        default:
          setErrorMsg(err.message || t('auth.unknownError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (!auth || !isFirebaseConfigured) throw new Error('Firebase not configured');
      try {
        await signInWithEmailAndPassword(auth, 'demo@example.com', 'demouser');
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          // Buat akun demo jika belum ada
          const userCred = await createUserWithEmailAndPassword(auth, 'demo@example.com', 'demouser');
          await setDoc(doc(db, 'users', userCred.user.uid), {
            username: 'Demo_Operative',
            email: 'demo@example.com',
            totalFragments: 0,
            completedModes: {}
          });
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error(err);
      console.warn("Demo login di Firebase gagal, beralih ke local preview.");
      setPreviewUser();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a0b2e]/90 p-8 rounded-2xl border border-blue-500/30 w-full max-w-sm shadow-[0_0_50px_rgba(59,130,246,0.2)]">
        <h2 className="text-3xl font-black italic mb-2 text-yellow-400 text-center uppercase tracking-wider">
          {isRegister ? t('auth.register') : t('auth.login')}
        </h2>
        <p className="text-center text-blue-300/60 mb-6 text-sm">
          {t('auth.access')}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div>
              <input                
                type="text" 
                placeholder={t('auth.fullName')}
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-black/50 border border-white/10 p-3 rounded-lg outline-none focus:border-blue-500 text-white placeholder-white/30 transition-colors" 
                disabled={loading}
              />
            </div>
          )}
          <div>
            <input 
              type="email" 
              placeholder={t('auth.email')}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-black/50 border border-white/10 p-3 rounded-lg outline-none focus:border-blue-500 text-white placeholder-white/30 transition-colors" 
              disabled={loading}
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder={t('auth.passwordPlaceholder')} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-black/50 border border-white/10 p-3 rounded-lg outline-none focus:border-blue-500 text-white placeholder-white/30 transition-colors" 
              disabled={loading}
            />
          </div>
          {isRegister && (
            <div>
              <input 
                type="password" 
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full bg-black/50 border border-white/10 p-3 rounded-lg outline-none focus:border-blue-500 text-white placeholder-white/30 transition-colors" 
                disabled={loading}
              />
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all uppercase tracking-wider ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            {loading ? t('auth.processing') : (isRegister ? t('auth.registerBtn') : t('auth.loginBtn'))}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }} 
            className="text-sm text-blue-300 hover:text-white transition-colors"
            disabled={loading}
          >
            {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <button 
            onClick={handleDemoLogin} 
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 font-bold py-3 rounded-lg border border-white/10 transition-colors text-yellow-500 hover:text-yellow-400 text-sm active:scale-95 flex items-center justify-center gap-2"
          >
            🕹️ {t('auth.demoLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
