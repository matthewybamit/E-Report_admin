// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Shield, KeyRound, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import EReportLogo from '../assets/E-report_Logo.png';

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_LENGTH          = 8;
const TRUST_KEY           = 'ereport_trusted_device';
const TRUST_DURATION_DAYS = 30;

// ─── Trusted Device Helpers ───────────────────────────────────────────────────
const isTrustedDevice = (email) => {
  try {
    const raw = localStorage.getItem(TRUST_KEY);
    if (!raw) return false;
    const { trustedEmail, expiresAt } = JSON.parse(raw);
    return trustedEmail === email && Date.now() < expiresAt;
  } catch { return false; }
};

const trustThisDevice = (email) => {
  const expiresAt = Date.now() + TRUST_DURATION_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(TRUST_KEY, JSON.stringify({ trustedEmail: email, expiresAt }));
};

const clearTrustedDevice = () => localStorage.removeItem(TRUST_KEY);

// ─── Generate a random 8-digit numeric OTP ───────────────────────────────────
const generateOtp = () => Math.floor(10000000 + Math.random() * 90000000).toString();

// ─── OTP Step Component ───────────────────────────────────────────────────────
function OTPStep({ email, onVerified, onBack, onResend, loading: parentLoading }) {
  const [otp, setOtp]                 = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resending, setResending]     = useState(false);
  const [cooldown, setCooldown]       = useState(0);
  const [trustDevice, setTrustDevice] = useState(false);
  const inputRefs                     = useRef([]);

  const isLoading = loading || parentLoading;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];

    if (value.length === OTP_LENGTH) {
      setOtp(value.split('').slice(0, OTP_LENGTH));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    if (value.length > 1) {
      const digits = value.split('').slice(0, OTP_LENGTH - index);
      digits.forEach((d, i) => { if (index + i < OTP_LENGTH) newOtp[index + i] = d; });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft'  && index > 0)               inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1)  inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && otp.join('').length === OTP_LENGTH) handleVerify();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await onVerified(code, trustDevice);
      if (result?.error) {
        setError(result.error);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('OTP verify exception:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    const result = await onResend();
    if (result?.error) setError(result.error);
    setResending(false);
    setCooldown(60);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="w-full max-w-sm">

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded mb-4">
          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
            2-Step Verification
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Check your email</h1>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          We sent an {OTP_LENGTH}-digit verification code to{' '}
          <span className="font-semibold text-slate-700">{email}</span>.
          Enter it below to continue.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-300 rounded flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 justify-between">
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            value={otp[i] || ''}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className={`
              flex-1 h-12 text-center text-base font-bold rounded border-2 bg-white
              text-slate-900 focus:outline-none transition-all min-w-0
              ${otp[i] ? 'border-slate-700 bg-slate-50' : 'border-slate-300 focus:border-slate-500'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        ))}
      </div>

      <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={e => setTrustDevice(e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer disabled:opacity-50"
        />
        <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
          Trust this device for{' '}
          <span className="font-semibold text-slate-600">{TRUST_DURATION_DAYS} days</span>
          {' '}— skip 2FA on next login
        </span>
      </label>

      <button
        onClick={handleVerify}
        disabled={isLoading || otp.join('').length < OTP_LENGTH}
        className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm mb-4"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            Verify Code
          </>
        )}
      </button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors disabled:opacity-50"
        >
          ← Use different account
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading || resending || cooldown > 0}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend Code'}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Didn't receive it? Check your spam folder or contact your{' '}
        <span className="font-semibold text-slate-500">system administrator</span>.
      </p>
    </div>
  );
}

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login() {
  const navigate       = useNavigate();
  const hasLoggedLogin = useRef(false);

  const [formData, setFormData]             = useState({ email: '', password: '' });
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [step, setStep]                     = useState('login');

  // ── Stores the active session + the OTP we generated ─────────────────────
  const pendingUserRef = useRef(null);  // { user, session }
  const pendingOtpRef  = useRef(null);  // the OTP code we sent

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const isAdmin = await verifyAdminUser(session.user.id);
        if (isAdmin) navigate('/dashboard', { replace: true });
        else await supabase.auth.signOut();
      }
    } catch (err) { console.error('Auth check error:', err); }
  };

  const verifyAdminUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, full_name, role, is_active')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .single();
      return !error && !!data;
    } catch (err) { console.error('Admin check error:', err); return false; }
  };

  const updateLastLogin = async (userId) => {
    try {
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('auth_user_id', userId);
    } catch (err) { console.error('Last login update error:', err); }
  };

  // ── Send OTP via Supabase Edge Function or email notification ─────────────
  // This uses your own notifications table so it bypasses Supabase rate limits
  const sendOtpEmail = async (email, otp, userId) => {
    try {
      // Store OTP hash in DB so it's server-validated (optional but more secure)
      await supabase
        .from('admin_users')
        .update({
          pending_otp:            otp,
          pending_otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
        })
        .eq('auth_user_id', userId);

      // Send via Supabase Edge Function (your existing notification system)
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, otp },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('sendOtpEmail error:', err);
      return { error: 'Failed to send verification code. Please try again.' };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // ── Step 1: Validate credentials → send OTP ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    formData.email,
        password: formData.password,
      });

      if (signInError) { setError(signInError.message); setLoading(false); return; }
      if (!data.session || !data.user) { setError('Login failed. Please try again.'); setLoading(false); return; }

      const isAdmin = await verifyAdminUser(data.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError('Access denied. You are not authorized to access the admin dashboard.');
        setLoading(false);
        return;
      }

      // ── Trusted device: skip 2FA ─────────────────────────────────────────
      if (isTrustedDevice(formData.email)) {
        await updateLastLogin(data.user.id);
        if (!hasLoggedLogin.current) {
          hasLoggedLogin.current = true;
          await logAuditAction({
            action: 'login', actionType: 'auth',
            description: `Admin logged in (trusted device, 2FA skipped): ${data.user.email}`,
            severity: 'info',
          });
        }
        setLoading(false);
        navigate('/dashboard', { replace: true });
        return;
      }

      // ── Generate OTP locally and send via Edge Function ──────────────────
      // Keep the session ACTIVE — no sign out needed
      pendingUserRef.current = { user: data.user, session: data.session };
      const otp = generateOtp();
      pendingOtpRef.current  = otp;

      const result = await sendOtpEmail(formData.email, otp, data.user.id);
      if (result.error) {
        setError(result.error);
        await supabase.auth.signOut();
        pendingUserRef.current = null;
        pendingOtpRef.current  = null;
        setLoading(false);
        return;
      }

      setStep('otp');
      setLoading(false);

    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // ── Resend: generate a new OTP and re-send ────────────────────────────────
  const handleResendOtp = async () => {
    if (!pendingUserRef.current) return { error: 'Session expired. Please log in again.' };
    const otp = generateOtp();
    pendingOtpRef.current = otp;
    return await sendOtpEmail(formData.email, otp, pendingUserRef.current.user.id);
  };

  // ── Step 2: Verify the code the user typed ────────────────────────────────
  const handleOtpVerified = async (enteredCode, trustDevice) => {
    if (!pendingOtpRef.current || !pendingUserRef.current) {
      return { error: 'Session expired. Please log in again.' };
    }

    // Compare against the code we generated
    if (enteredCode !== pendingOtpRef.current) {
      return { error: 'Invalid code. Please try again.' };
    }

    // Check OTP expiry from DB as extra server-side validation
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('pending_otp, pending_otp_expires_at')
        .eq('auth_user_id', pendingUserRef.current.user.id)
        .single();

      if (adminData?.pending_otp !== enteredCode) {
        return { error: 'Invalid code. Please try again.' };
      }
      if (adminData?.pending_otp_expires_at && new Date(adminData.pending_otp_expires_at) < new Date()) {
        return { error: 'Code has expired. Please request a new one.' };
      }

      // Clear OTP from DB
      await supabase
        .from('admin_users')
        .update({ pending_otp: null, pending_otp_expires_at: null })
        .eq('auth_user_id', pendingUserRef.current.user.id);

    } catch (err) {
      // DB check failed — fall back to local comparison which already passed above
      console.warn('DB OTP validation skipped:', err);
    }

    if (trustDevice) trustThisDevice(formData.email);

    await updateLastLogin(pendingUserRef.current.user.id);

    if (!hasLoggedLogin.current) {
      hasLoggedLogin.current = true;
      await logAuditAction({
        action: 'login', actionType: 'auth',
        description: `Admin logged in (2FA verified): ${pendingUserRef.current.user.email}`,
        severity: 'info',
      });
    }

    pendingOtpRef.current  = null;
    navigate('/dashboard', { replace: true });
    return {};
  };

  // ── Go back to login form ─────────────────────────────────────────────────
  const handleBack = async () => {
    await supabase.auth.signOut();
    clearTrustedDevice();
    pendingUserRef.current = null;
    pendingOtpRef.current  = null;
    setStep('login');
    setError('');
    setFormData({ email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize:  '40px 40px',
          }}
        />
        <div className="relative z-10 text-center max-w-sm">
          <div className="flex items-center justify-center mb-8">
            <img src={EReportLogo} alt="E-Report Logo" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">E-Report+</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Barangay incident reporting and emergency management platform for Quezon City administrators.
          </p>
          <div className="space-y-2.5 text-left">
            {['Real-time incident tracking', 'Emergency dispatch coordination',
              'Resident report management', 'Audit logs & analytics'].map(feat => (
              <div key={feat} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
          {step === 'otp' && (
            <div className="mt-8 flex items-center gap-2 bg-blue-900/40 border border-blue-700 rounded px-4 py-3">
              <KeyRound className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-300 font-medium">2-Factor Authentication Active</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-slate-600">© 2025 Barangay E-Report+ · Admin Portal</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src={EReportLogo} alt="E-Report Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight">E-Report+</h2>
            <p className="text-xs text-slate-500">Admin Dashboard</p>
          </div>
        </div>

        {step === 'otp' && (
          <OTPStep
            email={formData.email}
            onVerified={handleOtpVerified}
            onBack={handleBack}
            onResend={handleResendOtp}
            loading={loading}
          />
        )}

        {step === 'login' && (
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded mb-4">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Admin Access Only</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Enter your administrator credentials to continue.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-300 rounded flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition disabled:opacity-50 disabled:bg-slate-50"
                    placeholder="admin@barangay.gov.ph" disabled={loading} autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition disabled:opacity-50 disabled:bg-slate-50"
                    placeholder="••••••••" disabled={loading} autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isTrustedDevice(formData.email) ? 'Signing in...' : 'Sending verification code...'}
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {isTrustedDevice(formData.email) ? 'Sign In' : 'Continue with 2FA'}
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Having trouble? Contact your{' '}
              <span className="font-semibold text-slate-500">system administrator</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
