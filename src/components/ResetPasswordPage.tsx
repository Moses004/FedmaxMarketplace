import React, { useState, useEffect } from 'react';
import { 
  Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, 
  RefreshCw, KeyRound, ShieldCheck, ArrowRight 
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { 
  updatePassword, 
  checkPasswordRequirements, 
  formatAuthErrorMessage 
} from '../services/authService';
import { useToast } from '../context/ToastContext';

interface ResetPasswordPageProps {
  onNavigate: (path: string) => void;
  onOpenLoginModal?: () => void;
}

export default function ResetPasswordPage({
  onNavigate,
  onOpenLoginModal,
}: ResetPasswordPageProps) {
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isRecoveryDetected, setIsRecoveryDetected] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  // Detect Supabase PASSWORD_RECOVERY state, tokens, or expired URL params
  useEffect(() => {
    let isMounted = true;

    async function evaluateRecoveryContext() {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash || '';
      const search = window.location.search || '';

      // Check if Supabase passed an expired or invalid token error via redirect URL
      const isUrlExpired = 
        hash.includes('error_code=otp_expired') || 
        search.includes('error_code=otp_expired') ||
        hash.includes('error=access_denied') ||
        search.includes('error=access_denied') ||
        hash.includes('invalid_token') ||
        search.includes('invalid_token');

      if (isUrlExpired) {
        if (isMounted) {
          setIsLinkExpired(true);
          setIsCheckingSession(false);
        }
        return;
      }

      const hasRecoveryToken = hash.includes('type=recovery') || search.includes('type=recovery') || search.includes('code=');

      if (hasRecoveryToken && isMounted) {
        setIsRecoveryDetected(true);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          setIsRecoveryDetected(true);
        }
      } catch (err) {
        console.warn('[ResetPassword] getSession check warning:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    evaluateRecoveryContext();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setIsRecoveryDetected(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Countdown timer when password reset is successful
  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirectToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess]);

  const reqs = checkPasswordRequirements(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = reqs.isValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      if (!reqs.isValid) {
        setErrorMessage('Password must satisfy all security requirements listed below.');
      } else if (!passwordsMatch) {
        setErrorMessage('Passwords do not match.');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(newPassword);
      setIsSuccess(true);
      toast.success('Password Updated', 'Password updated successfully.');
    } catch (err: any) {
      const rawMsg = err?.message || '';
      const lower = rawMsg.toLowerCase();
      if (
        lower.includes('expired') || 
        lower.includes('invalid token') || 
        lower.includes('session has expired') || 
        lower.includes('otp_expired') ||
        lower.includes('access_denied')
      ) {
        setIsLinkExpired(true);
      } else {
        const formatted = formatAuthErrorMessage(err);
        setErrorMessage(formatted);
        toast.error('Update Failed', formatted);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedirectToLogin = () => {
    onNavigate('/');
    if (onOpenLoginModal) {
      setTimeout(() => {
        onOpenLoginModal();
      }, 150);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
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
            Create a new password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Create a strong, unique password to secure your Rentora verified account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
          {isCheckingSession ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Verifying recovery security token...
              </p>
            </div>
          ) : isLinkExpired ? (
            /* INVALID OR EXPIRED LINK STATE (Section 11) */
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  This password reset link is invalid or has expired.
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  For your security, password recovery links are single-use and expire after a short time. Please request a fresh link to continue.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="request-new-reset-link-btn"
                  onClick={() => onNavigate('/forgot-password')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Request a new reset link</span>
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* SUCCESS STATE (Section 12) */
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Password updated successfully.
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Your credentials have been securely updated in Supabase. You can now log in with your new password.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                <span>Redirecting to login in {countdown} second{countdown === 1 ? '' : 's'}...</span>
              </div>

              <button
                type="button"
                id="continue-to-login-btn"
                onClick={handleRedirectToLogin}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If no recovery state is detected, show a helpful alert */}
              {!isRecoveryDetected && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">No recovery session detected</span>
                    <span>Please ensure you opened the exact link sent to your email, or request a fresh link below.</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div 
                  id="reset-password-error-banner"
                  className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-2xl flex items-start gap-2.5 animate-fade-in"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reset-new-password-input"
                    required
                    disabled={isSubmitting}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter new strong password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="reset-confirm-password-input"
                    required
                    disabled={isSubmitting}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist (Requirement 8 & 9) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl space-y-2">
                <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 block uppercase tracking-wider">
                  Password Requirements
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 font-medium ${reqs.hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {reqs.hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>8+ characters</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${reqs.hasUpperCase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {reqs.hasUpperCase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>Uppercase</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${reqs.hasLowerCase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {reqs.hasLowerCase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>Lowercase</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${reqs.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {reqs.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>Number</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${reqs.hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {reqs.hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>Special character</span>
                  </div>

                  <div className={`flex items-center gap-1.5 font-medium ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="update-password-submit-btn"
                  disabled={isSubmitting || !isFormValid}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  id="request-new-link-btn"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition-colors cursor-pointer"
                >
                  Request a new reset link
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Auth</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
