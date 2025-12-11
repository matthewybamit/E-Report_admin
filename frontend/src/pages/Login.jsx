import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // ✅ VERIFY USER IS ADMIN
        const isAdmin = await verifyAdminUser(session.user.id);
        if (isAdmin) {
          navigate('/dashboard', { replace: true });
        } else {
          // Not an admin, sign out
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  // ✅ NEW: Verify user is in admin_users table
 // Add this inside verifyAdminUser function after line 47
const verifyAdminUser = async (userId) => {
  try {
    console.log('🔍 Checking admin for user ID:', userId); // ADD THIS
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .single();

    console.log('📊 Admin query result:', { data, error }); // ADD THIS

    if (error || !data) {
      console.error('Admin verification failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Admin check error:', err);
    return false;
  }
};


  // ✅ NEW: Update last login timestamp
  const updateLastLogin = async (userId) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Failed to update last login:', error);
      }
    } catch (err) {
      console.error('Last login update error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.session || !data.user) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // ✅ Step 2: VERIFY USER IS IN ADMIN_USERS TABLE
      const isAdmin = await verifyAdminUser(data.user.id);

      if (!isAdmin) {
        // User authenticated but NOT an admin
        await supabase.auth.signOut();
        setError('Access denied. You are not authorized to access the admin dashboard.');
        setLoading(false);
        return;
      }

      // ✅ Step 3: Update last login timestamp
      await updateLastLogin(data.user.id);

      // ✅ Step 4: Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <span className="text-4xl">🏠</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Barangay E-Report+
            </h1>
            <p className="text-gray-600">Admin Dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="admin@barangay.gov.ph"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>


          <p className="mt-4 text-center text-xs text-gray-500">
            Admin Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
