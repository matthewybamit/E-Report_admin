// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import EReportLogo from '../assets/E-report_Logo.png';

export default function Login() {
  const navigate = useNavigate();
  const hasLoggedLogin = useRef(false);

  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

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
      if (error || !data) return false;
      return true;
    } catch (err) {
      console.error('Admin check error:', err);
      return false;
    }
  };

  const updateLastLogin = async (userId) => {
    try {
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('auth_user_id', userId);
    } catch (err) { console.error('Last login update error:', err); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

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
        email: formData.email,
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

      await updateLastLogin(data.user.id);

      if (!hasLoggedLogin.current) {
        hasLoggedLogin.current = true;
        await logAuditAction({
          action: 'login', actionType: 'auth',
          description: `Admin logged in: ${data.user.email}`, severity: 'info',
        });
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left Panel (decorative) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        {/* Content */}
        <div className="relative z-10 text-center max-w-sm">
          <div className="flex items-center justify-center mb-8">
            <img src={EReportLogo} alt="E-Report Logo" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">E-Report+</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Barangay incident reporting and emergency management platform for Quezon City administrators.
          </p>
          {/* Feature pills */}
          <div className="space-y-2.5 text-left">
            {[
              'Real-time incident tracking',
              'Emergency dispatch coordination',
              'Resident report management',
              'Audit logs & analytics',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom label */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-slate-600">© 2025 Barangay E-Report+ · Admin Portal</p>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src={EReportLogo} alt="E-Report Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight">E-Report+</h2>
            <p className="text-xs text-slate-500">Admin Dashboard</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded mb-4">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Admin Access Only</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your administrator credentials to continue.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-300 rounded flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition disabled:opacity-50 disabled:bg-slate-50"
                  placeholder="admin@barangay.gov.ph"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition disabled:opacity-50 disabled:bg-slate-50"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Having trouble? Contact your{' '}
            <span className="font-semibold text-slate-500">system administrator</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
