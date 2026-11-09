import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorDetails(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      console.error('Raw login error:', err);
      setErrorDetails({
        name: err.name || 'Error',
        message: err.message || String(err),
        status: err.status || 'N/A',
        stack: err.stack || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">সপ্ন Fast Food & ক্যাফে</h1>
          <p className="text-slate-400 text-sm mt-1">Restaurant Management System</p>
        </div>

        {errorDetails && (
          <div className="mb-4 bg-red-950/90 border border-red-800 text-red-200 p-4 rounded-xl text-sm space-y-2">
            <div className="flex items-center space-x-2 font-bold text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorDetails.name} (Status: {errorDetails.status})</span>
            </div>
            <p className="font-mono text-xs bg-slate-900/80 p-2 rounded border border-red-900/50 break-all text-red-300">
              {errorDetails.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
