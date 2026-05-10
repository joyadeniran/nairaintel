import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/50 dark:bg-black/70 backdrop-blur-xl">
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="premium-card p-10 w-full max-w-md my-8 !rounded-3xl"
        >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center text-white font-display font-bold text-4xl shadow-sm">
            N
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Join NairaIntel'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-8 text-sm font-medium">
          {isLogin ? 'Intelligence for your Naira, delivered.' : 'Start your journey to financial clarity today.'}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 transition-all text-slate-800 dark:text-white"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 transition-all text-slate-800 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-brand-green text-white rounded-2xl font-display font-bold flex items-center justify-center gap-3 hover:bg-brand-green-light transition-all shadow-md active:scale-95"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]"><span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400 font-bold">Or continue with</span></div>
        </div>

        <button 
          onClick={loginWithGoogle}
          className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-display font-bold flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          <Chrome size={20} className="text-blue-500" />
          Google Account
        </button>

        <p className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-green font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  </div>
);
}
