// src/components/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Phone,
  Search,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Detect scroll for dynamic effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      path: '/dashboard',
      description: 'Overview'
    },
    { 
      icon: FileText, 
      label: 'Reports', 
      path: '/reports',
      description: 'User reports'
    },
    { 
      icon: Bell, 
      label: 'Emergency', 
      path: '/emergency',
      description: 'Active alerts',
      badge: 3,
      urgent: true
    },
    { 
      icon: Heart, 
      label: 'Medical', 
      path: '/medical',
      description: 'Health requests'
    },
    { 
      icon: Users, 
      label: 'Residents', 
      path: '/residents',
      description: 'Manage users'
    },
    { 
      icon: MessageSquare, 
      label: 'Announcements', 
      path: '/announcements',
      description: 'Community posts'
    },
    { 
      icon: Phone, 
      label: 'Contacts', 
      path: '/contacts',
      description: 'Directory'
    },
    { 
      icon: HelpCircle, 
      label: 'Support', 
      path: '/help',
      description: 'Help center'
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      path: '/analytics',
      description: 'Insights'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings',
      description: 'Configure'
    },
  ];

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      {/* Dynamic Sidebar with Follow Effect */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl transform transition-all duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${scrolled ? 'lg:shadow-2xl' : 'lg:shadow-xl'}`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Premium Logo Section */}
          <div className={`p-6 border-b border-gray-200/50 transition-all duration-300 ${
            scrolled ? 'lg:py-4' : 'lg:py-6'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className={`relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 ${
                    scrolled ? 'lg:p-2' : 'lg:p-2.5'
                  }`}>
                    <span className={`transition-all duration-300 ${scrolled ? 'lg:text-xl' : 'lg:text-2xl'}`}>🏠</span>
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg tracking-tight">E-Report+</h2>
                  <p className="text-xs text-gray-500 font-medium">Admin Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modern Navigation - Scrollable */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                Navigation
              </p>
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-sm'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm"></div>
                    )}
                    
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-1.5 rounded-lg transition-all ${
                        active 
                          ? 'bg-white/20 shadow-inner' 
                          : 'bg-gray-100/50 group-hover:bg-gray-200/80'
                      }`}>
                        <item.icon className={`w-4 h-4 ${
                          active 
                            ? 'text-white' 
                            : 'text-gray-600 group-hover:text-blue-600'
                        } transition-colors`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`text-sm font-semibold ${
                          active ? 'text-white' : 'text-gray-900'
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-xs ${
                          active ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {item.badge ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                        item.urgent
                          ? active 
                            ? 'bg-white text-red-600' 
                            : 'bg-red-500 text-white animate-pulse'
                          : active 
                            ? 'bg-white text-blue-600' 
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-4 h-4 transition-all ${
                        active 
                          ? 'text-white translate-x-0.5' 
                          : 'text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Enhanced Logout */}
          <div className="p-3 border-t border-gray-200/50 bg-gray-50/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group hover:shadow-sm"
            >
              <div className="p-1.5 rounded-lg bg-red-100/50 group-hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Premium Top Navigation with User Profile */}
        <header className={`bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 transition-all duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Mobile Menu + Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all hover:shadow-sm"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {navItems.find((item) => item.path === location.pathname)?.description || 'Manage your barangay'}
                </p>
              </div>
            </div>

            {/* Right: Search + Notifications + User Profile */}
            <div className="flex items-center space-x-3">
              {/* Enhanced Search */}
              <div className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-gray-100/80 hover:bg-gray-100 rounded-xl transition-all group cursor-pointer border border-gray-200/50 hover:border-gray-300/50 hover:shadow-sm">
                <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Search...</span>
                <kbd className="hidden lg:inline-block px-2 py-1 text-xs bg-white rounded-md border border-gray-300 shadow-sm text-gray-600 font-mono">
                  ⌘K
                </kbd>
              </div>

              {/* Premium Notification Bell */}
              <button className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:shadow-sm group">
                <Bell className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
                </span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full blur-sm opacity-40"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'admin@barangay.gov'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'admin@barangay.gov'}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm font-medium">Account Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/help');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Help & Support</span>
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-2 pb-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-semibold">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Modern Footer */}
        <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-600 font-medium">
              © 2025 <span className="font-semibold text-gray-900">Barangay E-Report+</span>
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Documentation
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Support
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Privacy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
