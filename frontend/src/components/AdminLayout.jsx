// src/components/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Home, FileText, Users, Bell, Settings, LogOut, Menu, X,
  Heart, MessageSquare, HelpCircle, BarChart3, Search,
  ChevronRight, ChevronDown, Camera, AlertCircle, CheckCircle,
  Clock, Trash2, Shield, UserCog,
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import EReportLogo from '../assets/E-report_Logo.png';

// ─── Custom Scrollbar Styles ──────────────────────────────────────────────────
const scrollbarStyles = `
  .sidebar-scroll::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 9999px; }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover { background-color: #475569; }
  .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #334155 transparent; }

  .panel-scroll::-webkit-scrollbar { width: 4px; }
  .panel-scroll::-webkit-scrollbar-track { background: transparent; }
  .panel-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 9999px; }
  .panel-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
  .panel-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`;

// ─── Alert Panel ──────────────────────────────────────────────────────────────
function AlertPanel({ alerts, onClose, onMarkAsRead, onMarkAllAsRead, onDelete }) {
  const groupedAlerts = {
    unread: alerts.filter(a => !a.is_read),
    read:   alerts.filter(a =>  a.is_read),
  };

  const getSeverityStyle = (severity) => ({
    urgent: 'bg-red-50 border-red-300',
    high:   'bg-orange-50 border-orange-300',
    medium: 'bg-amber-50 border-amber-200',
    low:    'bg-slate-50 border-slate-200',
  }[severity] || 'bg-slate-50 border-slate-200');

  const getSeverityIcon = (severity) =>
    severity === 'urgent' || severity === 'high'
      ? <AlertCircle className="w-4 h-4 text-red-600" />
      : <Bell className="w-4 h-4 text-slate-500" />;

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700 bg-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Admin Alerts</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {groupedAlerts.unread.length} unread notification{groupedAlerts.unread.length !== 1 ? 's' : ''}
            </p>
          </div>
          {groupedAlerts.unread.length > 0 && (
            <button onClick={onMarkAllAsRead} className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded transition-all">
              Mark all read
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto panel-scroll">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No alerts</p>
              <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <>
              {groupedAlerts.unread.length > 0 && (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 pt-1">
                    Unread ({groupedAlerts.unread.length})
                  </p>
                  {groupedAlerts.unread.map(alert => (
                    <div key={alert.id} onClick={() => onMarkAsRead(alert)}
                      className={`group relative p-3.5 border rounded cursor-pointer transition-all hover:shadow-sm ${getSeverityStyle(alert.severity)}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 line-clamp-2">{alert.title}</p>
                            <button onClick={e => { e.stopPropagation(); onDelete(alert.id); }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-all flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />{timeAgo(alert.created_at)}
                            </span>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {groupedAlerts.read.length > 0 && (
                <div className="p-3 space-y-1.5 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 pt-1">Earlier</p>
                  {groupedAlerts.read.slice(0, 5).map(alert => (
                    <div key={alert.id} onClick={() => { if (alert.link) window.location.href = alert.link; }}
                      className="group relative p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 bg-white opacity-60 transition-all">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700 line-clamp-1">{alert.title}</p>
                            <button onClick={e => { e.stopPropagation(); onDelete(alert.id); }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-all flex-shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(alert.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <button onClick={onClose} className="w-full py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Unauthorized Page ────────────────────────────────────────────────────────
function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          This page is only accessible to <span className="font-semibold text-slate-700">System Administrators</span>.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen]                     = useState(false);
  const [scrolled, setScrolled]                           = useState(false);
  const [userMenuOpen, setUserMenuOpen]                   = useState(false);
  const [alertPanelOpen, setAlertPanelOpen]               = useState(false);
  const [user, setUser]                                   = useState(null);
  const [userRole, setUserRole]                           = useState(null); // ← NEW
  const [reportsDropdownOpen, setReportsDropdownOpen]     = useState(false);
  const [emergencyDropdownOpen, setEmergencyDropdownOpen] = useState(false);
  const [adminAlerts, setAdminAlerts]                     = useState([]);
  const [unreadCount, setUnreadCount]                     = useState(0);
  const [urgentEmergenciesCount, setUrgentEmergenciesCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const isSysAdmin = userRole === 'system_administrator'; // ← role gate

  // Inject scrollbar styles
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.id = 'admin-scrollbar-styles';
    if (!document.getElementById('admin-scrollbar-styles')) {
      styleTag.textContent = scrollbarStyles;
      document.head.appendChild(styleTag);
    }
    return () => { document.getElementById('admin-scrollbar-styles')?.remove(); };
  }, []);

  useEffect(() => { getCurrentUser(); }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch role from admin_users
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        setUserRole(adminData?.role || null);

        fetchAdminAlerts(user.id);
        fetchUrgentEmergencies();
        subscribeToAdminAlerts(user.id);
        subscribeToEmergencies();
      }
    } catch (err) { console.error('Error getting user:', err); }
  };

  const fetchAdminAlerts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('admin_alerts').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      setAdminAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.is_read).length || 0);
    } catch (err) { console.error('Error fetching alerts:', err); }
  };

  const fetchUrgentEmergencies = async () => {
    try {
      const { count, error } = await supabase
        .from('emergencies').select('*', { count: 'exact', head: true })
        .in('severity', ['urgent', 'high']).eq('status', 'pending');
      if (error) throw error;
      setUrgentEmergenciesCount(count || 0);
    } catch (err) { console.error('Error fetching emergencies:', err); }
  };

  const subscribeToAdminAlerts = (userId) => {
    const channel = supabase.channel('admin-alerts-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAdminAlerts(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          if (payload.new.severity === 'urgent' && 'Notification' in window) {
            Notification.requestPermission().then(p => {
              if (p === 'granted') new Notification(payload.new.title, { body: payload.new.message, icon: '/logo.png' });
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          setAdminAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
          setUnreadCount(prev => payload.new.is_read && !payload.old.is_read ? prev - 1 : prev);
        } else if (payload.eventType === 'DELETE') {
          setAdminAlerts(prev => prev.filter(a => a.id !== payload.old.id));
          if (!payload.old.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  };

  const subscribeToEmergencies = () => {
    const channel = supabase.channel('emergencies-urgent')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, fetchUrgentEmergencies)
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const handleMarkAsRead = async (alert) => {
    try {
      await supabase.from('admin_alerts').update({ is_read: true }).eq('id', alert.id);
      setAlertPanelOpen(false);
      if (alert.link) navigate(alert.link);
    } catch (err) { console.error('Error marking alert as read:', err); }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase.from('admin_alerts').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setUnreadCount(0);
    } catch (err) { console.error('Error marking all as read:', err); }
  };

  const handleDeleteAlert = async (alertId) => {
    try { await supabase.from('admin_alerts').delete().eq('id', alertId); }
    catch (err) { console.error('Error deleting alert:', err); }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === '/reports' || location.pathname === '/evidence') setReportsDropdownOpen(true);
    if (location.pathname === '/emergency' || location.pathname === '/emergency-evidence') setEmergencyDropdownOpen(true);
  }, [location.pathname]);

  // ── Nav items — sysAdminOnly flags restricted pages ──
  const ALL_NAV_ITEMS = [
    { icon: Home,          label: 'Dashboard',    path: '/dashboard',     description: 'Overview'        },
    { icon: FileText,      label: 'Reports',       path: '/reports',       description: 'User reports',    hasDropdown: true, submenu: [{ icon: Camera, label: 'Evidence', path: '/evidence', description: 'Completion photos' }] },
    { icon: Bell,          label: 'Emergency',     path: '/emergency',     description: 'Active alerts',   badge: urgentEmergenciesCount, urgent: urgentEmergenciesCount > 0, hasDropdown: true, submenu: [{ icon: Camera, label: 'Evidence', path: '/emergency-evidence', description: 'Completion photos' }] },
    { icon: Heart,         label: 'Medical',       path: '/medical',       description: 'Health requests' },
    { icon: Users,         label: 'Residents',     path: '/residents',     description: 'Manage users',    sysAdminOnly: true },
    { icon: MessageSquare, label: 'Announcements', path: '/announcements', description: 'Community posts' },
    { icon: BarChart3,     label: 'Analytics',     path: '/analytics',     description: 'Insights'        },
    { icon: Shield,        label: 'Audit Logs',    path: '/audit-logs',    description: 'Track actions',   sysAdminOnly: true },
    { icon: UserCog,       label: 'Admin Users',   path: '/admin-users',   description: 'Manage admins',   sysAdminOnly: true },
    { icon: Settings,      label: 'Settings',      path: '/settings',      description: 'Configure'       },
  ];

  // Only show restricted items to system_administrator
  const navItems = ALL_NAV_ITEMS.filter(item => !item.sysAdminOnly || isSysAdmin);

  // Pages that require sysAdmin — used to gate <Outlet />
  const RESTRICTED_PATHS = ['/residents', '/audit-logs', '/admin-users'];
  const isRestrictedPage = RESTRICTED_PATHS.includes(location.pathname);
  const showUnauthorized = isRestrictedPage && userRole !== null && !isSysAdmin;

  const handleLogout = async () => {
    try {
      await logAuditAction({
        action: 'logout', actionType: 'auth',
        description: `Admin logged out: ${user?.email}`, severity: 'info',
      });
      setUserMenuOpen(false);
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) { console.error('Logout error:', err); }
  };

  const isActive        = (path)    => location.pathname === path;
  const isSubmenuActive = (submenu) => submenu?.some(item => location.pathname === item.path) ?? false;

  const toggleDropdown = (e, type) => {
    e.stopPropagation();
    if (type === 'reports')   setReportsDropdownOpen(p => !p);
    if (type === 'emergency') setEmergencyDropdownOpen(p => !p);
  };

  const userName    = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin User';
  const userEmail   = user?.email || 'admin@barangay.gov';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transform transition-all duration-300 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>

        {/* Brand */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={EReportLogo} alt="E-Report Logo" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="font-bold text-white text-sm tracking-tight">E-Report+</h2>
              <p className="text-xs text-slate-400 font-medium">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        {userRole && (
          <div className="flex-shrink-0 px-5 py-2.5 border-b border-slate-700/60">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
              isSysAdmin
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}>
              <Shield className="w-3 h-3" />
              {isSysAdmin ? 'System_administrator' : 'Operator'}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Navigation</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active       = isActive(item.path);
              const hasActiveSub = isSubmenuActive(item.submenu);
              const showActive   = active || hasActiveSub;
              const dropOpen     = item.label === 'Reports'   ? reportsDropdownOpen
                                 : item.label === 'Emergency' ? emergencyDropdownOpen : false;

              return (
                <div key={item.path}>
                  <button
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded transition-all duration-150 ${
                      showActive
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-0.5 h-5 rounded-full flex-shrink-0 transition-all ${showActive ? 'bg-white' : 'bg-transparent'}`} />
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${showActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-semibold truncate ${showActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                        <p className={`text-xs truncate ${showActive ? 'text-slate-300' : 'text-slate-500'}`}>{item.description}</p>
                      </div>
                    </div>

                    {item.badge > 0 ? (
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${item.urgent ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-200'}`}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : item.hasDropdown ? (
                      <button onClick={e => toggleDropdown(e, item.label.toLowerCase())} className="p-1 rounded hover:bg-slate-600 transition-colors flex-shrink-0">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''} text-slate-400`} />
                      </button>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${showActive ? 'text-slate-300' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                    )}
                  </button>

                  {item.hasDropdown && dropOpen && (
                    <div className="ml-8 mt-0.5 space-y-0.5">
                      {item.submenu.map(sub => {
                        const subActive = isActive(sub.path);
                        return (
                          <button key={sub.path} onClick={() => { navigate(sub.path); setSidebarOpen(false); }}
                            className={`w-full group flex items-center gap-3 px-3 py-2 rounded transition-all text-left ${
                              subActive ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                            }`}>
                            <sub.icon className={`w-3.5 h-3.5 flex-shrink-0 ${subActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <div className="text-left">
                              <p className={`text-xs font-semibold ${subActive ? 'text-white' : 'text-slate-400'}`}>{sub.label}</p>
                              <p className="text-xs text-slate-500">{sub.description}</p>
                            </div>
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

        {/* Logout */}
        <div className="flex-shrink-0 p-3 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-all group">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Header */}
        <header className={`bg-white border-b border-slate-200 sticky top-0 z-30 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:bg-slate-100 p-2 rounded transition-all">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-widest font-semibold">
                  {navItems.find(i => i.path === location.pathname)?.description ||
                   ALL_NAV_ITEMS.flatMap(i => i.submenu || []).find(s => s.path === location.pathname)?.description ||
                   'Overview'}
                </div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {navItems.find(i => i.path === location.pathname)?.label ||
                   ALL_NAV_ITEMS.flatMap(i => i.submenu || []).find(s => s.path === location.pathname)?.label ||
                   'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-all cursor-pointer group">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Search...</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs bg-white rounded border border-slate-300 text-slate-500 font-mono">⌘K</kbd>
              </div>

              <div className="relative">
                <button onClick={() => setAlertPanelOpen(p => !p)} className="relative p-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded transition-all group">
                  <Bell className="w-4 h-4 group-hover:text-slate-900 transition-colors" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white"></span>
                      </span>
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </>
                  )}
                </button>
                {alertPanelOpen && (
                  <AlertPanel alerts={adminAlerts} onClose={() => setAlertPanelOpen(false)}
                    onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onDelete={handleDeleteAlert} />
                )}
              </div>

              <div className="relative">
                <button onClick={() => setUserMenuOpen(p => !p)} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 border border-slate-200 rounded transition-all">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-white font-bold text-sm">{userInitial}</div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
                    <p className="text-xs text-slate-500 leading-tight">{userEmail}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-bold text-slate-900">{userName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
                        {userRole && (
                          <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                            isSysAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {isSysAdmin ? 'System Admin' : 'Operator'}
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors">
                          <Settings className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-medium">Account Settings</span>
                        </button>
                        <button onClick={() => { setUserMenuOpen(false); navigate('/help'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-medium">Help & Support</span>
                        </button>
                      </div>
                      <div className="border-t border-slate-100">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — gate restricted routes */}
        <main className="flex-1 overflow-y-auto">
          {showUnauthorized ? <UnauthorizedPage /> : <Outlet />}
        </main>

        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">© 2025 <span className="font-semibold text-slate-700">Barangay E-Report+</span></p>
            <div className="flex items-center gap-5">
              {['Documentation', 'Support', 'Privacy'].map(link => (
                <a key={link} href="#" className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors">{link}</a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
