import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { sendPasswordResetEmail, formatAuthErrorMessage } from '../services/authService';
import { isValidEmail } from '../utils/validation';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
  onOpenLoginModal?: () => void;
}

export default function ForgotPasswordPage({
  onNavigate,
  onOpenLoginModal,
}: ForgotPasswordPageProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(cleanEmail);
      setIsSuccess(true);
      setCooldown(60); // 60s cooldown before resending
      toast.success('Reset Link Sent', 'Check your email for a password reset link.');
    } catch (err: any) {
      const formatted = formatAuthErrorMessage(err);
      setErrorMessage(formatted);
      toast.error('Password Reset Failed', formatted);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isSubmitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) return;

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(cleanEmail);
      setCooldown(60);
      toast.success('Reset Link Resent', 'Check your email for a password reset link.');
    } catch (err: any) {
      const formatted = formatAuthErrorMessage(err);
      setErrorMessage(formatted);
      toast.error('Resend Failed', formatted);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    onNavigate('/');
    if (onOpenLoginModal) {
      setTimeout(() => {
        onOpenLoginModal();
      }, 150);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
      {/* Background Decor */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div 
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 cursor-pointer group mb-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              R
            </div>
            <span className="font-display font-black text-2xl text-slate-900 dark:text-white tracking-tight">
              Rentora
            </span>
          </div>
          <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white">
            Reset your password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Enter the email associated with your Rentora account and we will send you a password reset link.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
          {isSuccess ? (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Check your email for a password reset link.
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  We've sent secure recovery instructions to:
                </p>
                <div className="mt-2 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl inline-block border border-emerald-200/60 dark:border-emerald-800/60 break-all">
                  {email}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-3 leading-normal">
                  Please click the link in your email to choose a new password. If you do not receive an email within a few minutes, check your spam folder or request a new link.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  id="resend-reset-email-btn"
                  disabled={cooldown > 0 || isSubmitting}
                  onClick={handleResend}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>{cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend Reset Link'}</span>
                </button>

                <button
                  type="button"
                  id="success-back-to-login-btn"
                  onClick={handleBackToLogin}
                  className="w-full py-2.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div 
                  id="forgot-password-error-banner"
                  className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-2xl flex items-start gap-2.5 animate-fade-in"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="forgot-password-email-input"
                    required
                    autoFocus
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:opacity-60"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="send-reset-link-btn"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Recovery Link...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  id="back-to-login-btn"
                  onClick={handleBackToLogin}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Encrypted by Supabase</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
