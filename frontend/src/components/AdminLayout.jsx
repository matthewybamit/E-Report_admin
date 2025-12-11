// src/components/AdminLayout.jsx - WITH AUDIT LOGGING
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Shield,
  UserCog,
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { logAdminAction, updateAdminLastLogin } from '../utils/auditLog';
import EReportLogo from '../assets/E-report_Logo.png';

// Alert Panel Component (renamed from NotificationPanel)
function AlertPanel({ alerts, onClose, onMarkAsRead, onMarkAllAsRead, onDelete }) {
  const groupedAlerts = {
    unread: alerts.filter(a => !a.is_read),
    read: alerts.filter(a => a.is_read)
  };

  const getSeverityColor = (severity) => {
    const colors = {
      urgent: 'bg-red-50 border-red-200',
      high: 'bg-orange-50 border-orange-200',
      medium: 'bg-yellow-50 border-yellow-200',
      low: 'bg-blue-50 border-blue-200'
    };
    return colors[severity] || 'bg-gray-50 border-gray-200';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'urgent' || severity === 'high') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <Bell className="w-4 h-4 text-blue-600" />;
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      ></div>
      <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Admin Alerts</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {groupedAlerts.unread.length} unread
              </p>
            </div>
            {groupedAlerts.unread.length > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-semibold">No alerts</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <>
              {/* Unread Section */}
              {groupedAlerts.unread.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                    Unread ({groupedAlerts.unread.length})
                  </p>
                  <div className="space-y-2">
                    {groupedAlerts.unread.map((alert) => (
                      <div
                        key={alert.id}
                        className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${getSeverityColor(alert.severity)} ${
                          alert.severity === 'urgent' ? 'animate-pulse' : ''
                        }`}
                        onClick={() => onMarkAsRead(alert)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-gray-900 line-clamp-2">
                                {alert.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(alert.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {timeAgo(alert.created_at)}
                              </span>
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Read Section */}
              {groupedAlerts.read.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                    Earlier
                  </p>
                  <div className="space-y-2">
                    {groupedAlerts.read.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="group relative p-4 border border-gray-200 rounded-xl cursor-pointer transition-all hover:bg-gray-50 bg-white opacity-60"
                        onClick={() => {
                          if (alert.link) {
                            window.location.href = alert.link;
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-700 line-clamp-1">
                                {alert.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(alert.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {timeAgo(alert.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [emergencyDropdownOpen, setEmergencyDropdownOpen] = useState(false);
  
  // Admin Alerts State
  const [adminAlerts, setAdminAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Badge Counts
  const [urgentEmergenciesCount, setUrgentEmergenciesCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Update last_login timestamp
        await updateAdminLastLogin();
        
        // Log login action
        await logAdminAction({
          action: 'login',
          actionType: 'auth',
          description: `Admin logged in: ${user.email}`,
          severity: 'info'
        });

        fetchAdminAlerts(user.id);
        fetchUrgentEmergencies();
        subscribeToAdminAlerts(user.id);
        subscribeToEmergencies();
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  // Fetch admin alerts
  const fetchAdminAlerts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setAdminAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching admin alerts:', error);
    }
  };

  // Fetch urgent emergencies count
  const fetchUrgentEmergencies = async () => {
    try {
      const { count, error } = await supabase
        .from('emergencies')
        .select('*', { count: 'exact', head: true })
        .in('severity', ['urgent', 'high'])
        .eq('status', 'pending');

      if (error) throw error;
      setUrgentEmergenciesCount(count || 0);
    } catch (error) {
      console.error('Error fetching urgent emergencies:', error);
    }
  };

  // Subscribe to real-time admin alerts
  const subscribeToAdminAlerts = (userId) => {
    const channel = supabase
      .channel('admin-alerts-' + userId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_alerts',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAdminAlerts(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification for urgent alerts
          if (payload.new.severity === 'urgent' && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(payload.new.title, {
                  body: payload.new.message,
                  icon: '/logo.png',
                  badge: '/logo.png'
                });
              }
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          setAdminAlerts(prev => 
            prev.map(a => a.id === payload.new.id ? payload.new : a)
          );
          setUnreadCount(prev => payload.new.is_read && !payload.old.is_read ? prev - 1 : prev);
        } else if (payload.eventType === 'DELETE') {
          setAdminAlerts(prev => prev.filter(a => a.id !== payload.old.id));
          if (!payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // Subscribe to emergencies for badge count
  const subscribeToEmergencies = () => {
    const channel = supabase
      .channel('emergencies-urgent')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergencies'
      }, () => {
        fetchUrgentEmergencies();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // Mark alert as read and navigate
  const handleMarkAsRead = async (alert) => {
    try {
      await supabase
        .from('admin_alerts')
        .update({ is_read: true })
        .eq('id', alert.id);

      setAlertPanelOpen(false);

      // Navigate to the link if exists
      if (alert.link) {
        navigate(alert.link);
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('admin_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alertId) => {
    try {
      await supabase
        .from('admin_alerts')
        .delete()
        .eq('id', alertId);
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === '/reports' || location.pathname === '/evidence') {
      setReportsDropdownOpen(true);
    }
    if (location.pathname === '/emergency' || location.pathname === '/emergency-evidence') {
      setEmergencyDropdownOpen(true);
    }
  }, [location.pathname]);

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
      description: 'User reports',
      hasDropdown: true,
      submenu: [
        {
          icon: Camera,
          label: 'Evidence',
          path: '/evidence',
          description: 'Completion photos'
        }
      ]
    },
    {
      icon: Bell,
      label: 'Emergency',
      path: '/emergency',
      description: 'Active alerts',
      badge: urgentEmergenciesCount,
      urgent: urgentEmergenciesCount > 0,
      hasDropdown: true,
      submenu: [
        {
          icon: Camera,
          label: 'Evidence',
          path: '/emergency-evidence',
          description: 'Completion photos'
        }
      ]
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
    // { 
    //   icon: Phone, 
    //   label: 'Contacts', 
    //   path: '/contacts',
    //   description: 'Directory'
    // },
    // { 
    //   icon: HelpCircle, 
    //   label: 'Support', 
    //   path: '/help',
    //   description: 'Help center'
    // },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      path: '/analytics',
      description: 'Insights'
    },
    { 
      icon: Shield, 
      label: 'Audit Logs', 
      path: '/audit-logs',
      description: 'Track actions'
    },
    { 
      icon: UserCog, 
      label: 'Admin Users', 
      path: '/admin-users',
      description: 'Manage admins'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings',
      description: 'Configure'
    },
  ];

  const handleLogout = async () => {
    try {
      // Log logout action
      await logAdminAction({
        action: 'logout',
        actionType: 'auth',
        description: `Admin logged out: ${user?.email}`,
        severity: 'info'
      });

      setUserMenuOpen(false);
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const isSubmenuActive = (submenu) => {
    if (!submenu) return false;
    return submenu.some(item => location.pathname === item.path);
  };

  const toggleDropdown = (e, dropdownType) => {
    e.stopPropagation();
    if (dropdownType === 'reports') {
      setReportsDropdownOpen(!reportsDropdownOpen);
    } else if (dropdownType === 'emergency') {
      setEmergencyDropdownOpen(!emergencyDropdownOpen);
    }
  };

  const handleNavigation = (item) => {
    navigate(item.path);
    setSidebarOpen(false);
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin User';
  const userEmail = user?.email || 'admin@barangay.gov';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl transform transition-all duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${scrolled ? 'lg:shadow-2xl' : 'lg:shadow-xl'}`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <div className={`p-6 border-b border-gray-200/50 transition-all duration-300 ${
            scrolled ? 'lg:py-4' : 'lg:py-6'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <div className={` ${
                    scrolled ? 'lg:p-2' : 'lg:p-2.5'
                  }`}>
                    <img
                      src={EReportLogo}
                      alt="E-Report Logo"
                      className={`transition-all duration-300 ${
                        scrolled ? 'h-15 w-15 lg:h-10 lg:w-10' : 'h-20 w-20 lg:h-12 lg:w-12'
                      }`}
                    />
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

          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                Navigation
              </p>
              {navItems.map((item) => {
                const active = isActive(item.path);
                const hasActiveSubmenu = isSubmenuActive(item.submenu);
                const showAsActive = active || hasActiveSubmenu;
                const currentDropdownOpen = item.label === 'Reports' ? reportsDropdownOpen : 
                                           item.label === 'Emergency' ? emergencyDropdownOpen : false;

                return (
                  <div key={item.path}>
                    <button
                      onClick={() => handleNavigation(item)}
                      className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        showAsActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-sm'
                      }`}
                    >
                      {showAsActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm"></div>
                      )}

                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-1.5 rounded-lg transition-all ${
                          showAsActive 
                            ? 'bg-white/20 shadow-inner' 
                            : 'bg-gray-100/50 group-hover:bg-gray-200/80'
                        }`}>
                          <item.icon className={`w-4 h-4 ${
                            showAsActive 
                              ? 'text-white' 
                              : 'text-gray-600 group-hover:text-blue-600'
                          } transition-colors`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-semibold ${
                            showAsActive ? 'text-white' : 'text-gray-900'
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-xs ${
                            showAsActive ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {item.badge > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                          item.urgent
                            ? showAsActive 
                              ? 'bg-white text-red-600' 
                              : 'bg-red-500 text-white animate-pulse'
                            : showAsActive 
                              ? 'bg-white text-blue-600' 
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.badge}
                        </span>
                      ) : item.hasDropdown ? (
                        <button
                          onClick={(e) => toggleDropdown(e, item.label.toLowerCase())}
                          className={`p-1 rounded-lg transition-all ${
                            showAsActive 
                              ? 'hover:bg-white/20' 
                              : 'hover:bg-gray-200'
                          }`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            currentDropdownOpen ? 'rotate-180' : ''
                          } ${showAsActive ? 'text-white' : 'text-gray-400'}`} />
                        </button>
                      ) : (
                        <ChevronRight className={`w-4 h-4 transition-all ${
                          showAsActive 
                            ? 'text-white translate-x-0.5' 
                            : 'text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                        }`} />
                      )}
                    </button>

                    {item.hasDropdown && currentDropdownOpen && (
                      <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.submenu.map((subItem) => {
                          const subActive = isActive(subItem.path);
                          return (
                            <button
                              key={subItem.path}
                              onClick={() => {
                                navigate(subItem.path);
                                setSidebarOpen(false);
                              }}
                              className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                                subActive
                                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <div className={`p-1 rounded-lg transition-all ${
                                  subActive 
                                    ? 'bg-blue-100' 
                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                  <subItem.icon className={`w-3.5 h-3.5 ${
                                    subActive 
                                      ? 'text-blue-600' 
                                      : 'text-gray-500 group-hover:text-blue-600'
                                  } transition-colors`} />
                                </div>
                                <div className="text-left flex-1">
                                  <p className={`text-sm font-semibold ${
                                    subActive ? 'text-blue-700' : 'text-gray-700'
                                  }`}>
                                    {subItem.label}
                                  </p>
                                  <p className={`text-xs ${
                                    subActive ? 'text-blue-600' : 'text-gray-500'
                                  }`}>
                                    {subItem.description}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className={`w-3.5 h-3.5 transition-all ${
                                subActive 
                                  ? 'text-blue-600 translate-x-0.5' 
                                  : 'text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                              }`} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className={`bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 transition-all duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all hover:shadow-sm"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {navItems.find((item) => item.path === location.pathname)?.label || 
                   navItems.find((item) => item.submenu?.some(sub => sub.path === location.pathname))?.submenu?.find(sub => sub.path === location.pathname)?.label ||
                   'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {navItems.find((item) => item.path === location.pathname)?.description || 
                   navItems.find((item) => item.submenu?.some(sub => sub.path === location.pathname))?.submenu?.find(sub => sub.path === location.pathname)?.description ||
                   'Manage your barangay'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-gray-100/80 hover:bg-gray-100 rounded-xl transition-all group cursor-pointer border border-gray-200/50 hover:border-gray-300/50 hover:shadow-sm">
                <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Search...</span>
                <kbd className="hidden lg:inline-block px-2 py-1 text-xs bg-white rounded-md border border-gray-300 shadow-sm text-gray-600 font-mono">
                  ⌘K
                </kbd>
              </div>

              {/* Alert Bell with Real Count */}
              <div className="relative">
                <button 
                  onClick={() => setAlertPanelOpen(!alertPanelOpen)}
                  className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:shadow-sm group"
                >
                  <Bell className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
                      </span>
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </>
                  )}
                </button>

                {/* Alert Panel */}
                {alertPanelOpen && (
                  <AlertPanel
                    alerts={adminAlerts}
                    onClose={() => setAlertPanelOpen(false)}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDelete={handleDeleteAlert}
                  />
                )}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full blur-sm opacity-40"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
                      {userInitial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userEmail}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>
                      </div>

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

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

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
