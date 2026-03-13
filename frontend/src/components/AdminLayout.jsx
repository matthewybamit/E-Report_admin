// src/components/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, FileText, Users, Bell, Settings, LogOut, Menu, X,
  Heart, MessageSquare, HelpCircle, BarChart3, Search,
  ChevronRight, ChevronDown, Camera, AlertCircle, CheckCircle,
  Clock, Trash2, Shield, UserCog, Ambulance, Flame, AlertTriangle,
  MapPin, ExternalLink, ClipboardList, Send, Loader2, Radio, Minimize2,
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

  .chat-scroll::-webkit-scrollbar { width: 3px; }
  .chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 9999px; }
  .chat-scroll { scrollbar-width: thin; scrollbar-color: #475569 transparent; }

  @keyframes shrink-bar { from { width: 100%; } to { width: 0%; } }
  @keyframes toast-in   { from { transform: translateX(110%); opacity: 0; }
                           to   { transform: translateX(0);    opacity: 1; } }
  @keyframes toast-out  { from { transform: translateX(0);    opacity: 1; }
                           to   { transform: translateX(110%); opacity: 0; } }
  @keyframes chat-slide-up { from { transform: translateY(16px); opacity: 0; }
                              to   { transform: translateY(0);    opacity: 1; } }
  .toast-enter    { animation: toast-in      0.3s ease forwards; }
  .toast-exit     { animation: toast-out     0.3s ease forwards; }
  .chat-slide-up  { animation: chat-slide-up 0.22s ease forwards; }
`;

// ─── Emergency Audio Alert ────────────────────────────────────────────────────
function playAlertSound() {
  try {
    const ctx        = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain       = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'square';
    [0, 0.28, 0.56].forEach((t) => {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
      gain.gain.setValueAtTime(0,    ctx.currentTime + t + 0.18);
    });
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.9);
  } catch { }
}

async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  return (await Notification.requestPermission()) === 'granted';
}

function showPushNotification(emergency) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(`🚨 ${emergency.type} Emergency`, {
    body: `${emergency.description || 'New emergency reported'}\n📍 ${emergency.location_text || 'Unknown location'}`,
    icon: '/favicon.ico', tag: `emergency-${emergency.id}`, requireInteraction: true,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

// ─── Emergency Toast ──────────────────────────────────────────────────────────
const EMERGENCY_TYPE_CONFIG = {
  Medical:  { icon: Ambulance,     bg: 'bg-red-600',    border: 'border-red-400',    ring: 'ring-red-400'    },
  Fire:     { icon: Flame,         bg: 'bg-orange-600', border: 'border-orange-400', ring: 'ring-orange-400' },
  Crime:    { icon: Shield,        bg: 'bg-purple-700', border: 'border-purple-400', ring: 'ring-purple-400' },
  Accident: { icon: AlertTriangle, bg: 'bg-yellow-600', border: 'border-yellow-400', ring: 'ring-yellow-400' },
};

function EmergencyToast({ emergency, onDismiss, onView }) {
  const [exiting, setExiting] = useState(false);
  const cfg  = EMERGENCY_TYPE_CONFIG[emergency?.type] || EMERGENCY_TYPE_CONFIG.Accident;
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(handleDismiss, 12000);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => { setExiting(true); setTimeout(() => onDismiss(emergency.id), 280); };

  return (
    <div className={`w-[360px] bg-white rounded-xl shadow-2xl border ${cfg.border} ring-2 ${cfg.ring} overflow-hidden ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className={`${cfg.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"><Icon className="w-4 h-4 text-white" /></div>
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest leading-none">🚨 New Emergency</p>
            <p className="text-white text-sm font-bold leading-tight mt-0.5">{emergency.type} Emergency</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1 rounded transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-sm text-slate-800 font-semibold leading-snug line-clamp-2">{emergency.description || 'Emergency reported — immediate attention required.'}</p>
        {(emergency.location_text || emergency.latitude) && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
            {emergency.location_text || `${emergency.latitude?.toFixed(5)}, ${emergency.longitude?.toFixed(5)}`}
          </p>
        )}
        <p className="text-xs text-slate-400">{new Date(emergency.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
      </div>
      <div className="px-4 pb-3 flex gap-2">
        <button onClick={() => { onView(emergency); handleDismiss(); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${cfg.bg} hover:opacity-90 text-white rounded text-xs font-bold transition-all`}>
          <ExternalLink className="w-3.5 h-3.5" />View & Respond
        </button>
        <button onClick={handleDismiss} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold transition-all">Dismiss</button>
      </div>
      <div className="h-1 bg-slate-100">
        <div className={`h-full ${cfg.bg} opacity-80`} style={{ animation: 'shrink-bar 12s linear forwards' }} />
      </div>
    </div>
  );
}

// ─── Alert Panel ──────────────────────────────────────────────────────────────
function AlertPanel({ alerts, onClose, onMarkAsRead, onMarkAllAsRead, onDelete }) {
  const groupedAlerts = { unread: alerts.filter(a => !a.is_read), read: alerts.filter(a => a.is_read) };
  const getSeverityStyle = (s) => ({ urgent: 'bg-red-50 border-red-300', high: 'bg-orange-50 border-orange-300', medium: 'bg-amber-50 border-amber-200', low: 'bg-slate-50 border-slate-200' }[s] || 'bg-slate-50 border-slate-200');
  const getSeverityIcon  = (s) => s === 'urgent' || s === 'high' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Bell className="w-4 h-4 text-slate-500" />;
  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700 bg-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Admin Alerts</h3>
            <p className="text-xs text-slate-400 mt-0.5">{groupedAlerts.unread.length} unread notification{groupedAlerts.unread.length !== 1 ? 's' : ''}</p>
          </div>
          {groupedAlerts.unread.length > 0 && (
            <button onClick={onMarkAllAsRead} className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded transition-all">Mark all read</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto panel-scroll">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mb-3"><Bell className="w-6 h-6 text-slate-400" /></div>
              <p className="text-sm font-semibold text-slate-600">No alerts</p>
              <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <>
              {groupedAlerts.unread.length > 0 && (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 pt-1">Unread ({groupedAlerts.unread.length})</p>
                  {groupedAlerts.unread.map(alert => (
                    <div key={alert.id} onClick={() => onMarkAsRead(alert)} className={`group relative p-3.5 border rounded cursor-pointer transition-all hover:shadow-sm ${getSeverityStyle(alert.severity)}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 line-clamp-2">{alert.title}</p>
                            <button onClick={e => { e.stopPropagation(); onDelete(alert.id); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-all flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{timeAgo(alert.created_at)}</span>
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
                    <div key={alert.id} onClick={() => { if (alert.link) window.location.href = alert.link; }} className="group relative p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 bg-white opacity-60 transition-all">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700 line-clamp-1">{alert.title}</p>
                            <button onClick={e => { e.stopPropagation(); onDelete(alert.id); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-all flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
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
            <button onClick={onClose} className="w-full py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Close</button>
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
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-slate-400" /></div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">This page is only accessible to <span className="font-semibold text-slate-700">System Administrators</span>.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded transition-colors">Back to Dashboard</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── GLOBAL FLOATING CHAT WIDGET ─────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const fmtTime      = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDateGroup = (iso) => {
  const d = new Date(iso), today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Single conversation pane ─────────────────────────────────────────────────
function ConversationPane({ thread, adminUser, adminRole, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const scrollRef               = useRef(null);
  const inputRef                = useRef(null);
  const channelRef              = useRef(null);

  const incidentCol = thread.type === 'emergency' ? 'emergency_id' : 'report_id';
  const myId        = adminUser?.auth_user_id ?? adminUser?.id;

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chat_messages').select('*')
        .eq(incidentCol, thread.id).order('created_at', { ascending: true });
      setMessages(data ?? []);
      setLoading(false);
    };
    fetchMessages();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`admin-chat-${thread.type}-${thread.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `${incidentCol}=eq.${thread.id}` }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [thread.id]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 60);
  }, [messages.length]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    const senderName = adminUser?.full_name ?? adminUser?.email?.split('@')[0] ?? 'Operator';
    const optimistic = { id: `opt-${Date.now()}`, [incidentCol]: thread.id, sender_id: myId, sender_role: adminRole, sender_name: senderName, message: text, is_read: false, created_at: new Date().toISOString(), _optimistic: true };
    setMessages(prev => [...prev, optimistic]);
    const { data, error } = await supabase.from('chat_messages')
      .insert({ [incidentCol]: thread.id, sender_id: myId, sender_role: adminRole, sender_name: senderName, message: text })
      .select().single();
    if (error) setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    else       setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
    setSending(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const grouped = messages.reduce((acc, msg) => {
    const key = fmtDateGroup(msg.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const accentColor  = thread.type === 'emergency' ? 'text-red-400'     : 'text-amber-400';
  const accentBorder = thread.type === 'emergency' ? 'border-red-500/20' : 'border-amber-500/20';

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${accentBorder} bg-slate-800/80 flex-shrink-0`}>
        <button onClick={onBack} className="text-slate-400 hover:text-white p-1 rounded transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <Radio className={`w-3 h-3 ${accentColor} animate-pulse flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold truncate ${accentColor}`}>{thread.label}</p>
          <p className="text-[10px] text-slate-500 truncate">{thread.subtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-3 py-2 space-y-1" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-4 h-4 text-slate-500 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <MessageSquare className="w-6 h-6 text-slate-700" />
            <p className="text-xs text-slate-500">No messages yet. Say something!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dayMsgs]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-slate-700/60" />
                <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{dateLabel}</span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>
              {dayMsgs.map(msg => {
                const isMine = msg.sender_id === myId;
                return (
                  <div key={msg.id} className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && <span className="text-[10px] font-bold text-blue-400 px-1">{msg.sender_name}</span>}
                      <div className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words
                        ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-700 text-slate-100 rounded-bl-sm'}
                        ${msg._optimistic ? 'opacity-60' : ''}`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-slate-600 px-1">{fmtTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-2.5 border-t border-slate-700/60 flex-shrink-0">
        <textarea
          ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Message responder… (Enter to send)" rows={1} maxLength={500}
          className="flex-1 resize-none bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500 transition-colors chat-scroll"
          style={{ maxHeight: '72px' }}
        />
        <button onClick={handleSend} disabled={!input.trim() || sending}
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all
            ${input.trim() && !sending ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

// ─── Thread list item ─────────────────────────────────────────────────────────
function ThreadItem({ thread, onClick }) {
  const accentColor = thread.type === 'emergency' ? 'text-red-400'  : 'text-amber-400';
  const dotColor    = thread.type === 'emergency' ? 'bg-red-500'    : 'bg-amber-500';
  const iconBg      = thread.type === 'emergency' ? 'bg-red-500/10' : 'bg-amber-500/10';
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg transition-all text-left group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className="text-sm">{thread.type === 'emergency' ? '🚨' : '📋'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${accentColor}`}>{thread.label}</p>
        <p className="text-[10px] text-slate-500 truncate mt-0.5">{thread.lastMessage || thread.subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {thread.unread > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${dotColor}`}>{thread.unread > 9 ? '9+' : thread.unread}</span>
        )}
        <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
}

// ─── The floating widget itself ───────────────────────────────────────────────
function GlobalChatWidget({ adminUser, adminRole }) {
  const [open, setOpen]                     = useState(false);
  const [threads, setThreads]               = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeThread, setActiveThread]     = useState(null);
  const [totalUnread, setTotalUnread]       = useState(0);

  const myId = adminUser?.auth_user_id ?? adminUser?.id;

  const loadThreads = useCallback(async () => {
    if (!myId) return;
    setLoadingThreads(true);
    const [{ data: emergencies }, { data: reports }] = await Promise.all([
      supabase.from('emergencies').select('id, type, severity, location_text, status, created_at').in('status', ['dispatched', 'pending']).order('created_at', { ascending: false }).limit(20),
      supabase.from('reports').select('id, title, category, status, created_at').in('status', ['in-progress', 'pending']).order('created_at', { ascending: false }).limit(20),
    ]);
    const { data: unreadData } = await supabase.from('chat_messages').select('emergency_id, report_id').eq('is_read', false).neq('sender_id', myId);
    const emUnread = {}, rpUnread = {};
    (unreadData ?? []).forEach(m => {
      if (m.emergency_id) emUnread[m.emergency_id] = (emUnread[m.emergency_id] || 0) + 1;
      if (m.report_id)    rpUnread[m.report_id]    = (rpUnread[m.report_id]    || 0) + 1;
    });
    const emThreads = (emergencies ?? []).map(e => ({ id: e.id, type: 'emergency', label: `🚨 ${e.type ?? 'Emergency'}`, subtitle: e.location_text ?? `Severity: ${e.severity ?? 'high'}`, unread: emUnread[e.id] || 0, lastMessage: null, created_at: e.created_at }));
    const rpThreads = (reports ?? []).map(r => ({ id: r.id, type: 'report', label: `📋 ${r.title ?? 'Report'}`, subtitle: r.category ?? 'General', unread: rpUnread[r.id] || 0, lastMessage: null, created_at: r.created_at }));
    const all = [...emThreads, ...rpThreads].sort((a, b) => (b.unread - a.unread) || (new Date(b.created_at) - new Date(a.created_at)));
    setThreads(all);
    setTotalUnread(all.reduce((s, t) => s + t.unread, 0));
    setLoadingThreads(false);
  }, [myId]);

  useEffect(() => { if (adminUser) loadThreads(); }, [adminUser]);
  useEffect(() => { const t = setInterval(() => { if (adminUser) loadThreads(); }, 30000); return () => clearInterval(t); }, [adminUser]);

  useEffect(() => {
    if (!myId) return;
    const channel = supabase.channel('global-chat-unread-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (payload.new.sender_id === myId) return;
        setTotalUnread(prev => prev + 1);
        setThreads(prev => prev.map(t => {
          const match = (t.type === 'emergency' && t.id === payload.new.emergency_id) || (t.type === 'report' && t.id === payload.new.report_id);
          return match ? { ...t, unread: t.unread + 1, lastMessage: payload.new.message } : t;
        }));
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [myId]);

  if (!adminUser) return null;

  return (
    <>
      {/* ── Floating button ── fixed bottom-right, always visible ── */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) loadThreads(); }}
        title="Responder Chat"
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-slate-800 hover:bg-slate-700
          border border-slate-600 rounded-2xl shadow-2xl flex items-center justify-center
          transition-all duration-200 hover:scale-105 active:scale-95 group"
      >
        <MessageSquare className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
        {totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold
            rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-slate-900">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* ── Chat panel — slides up above the button ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9997] w-80 bg-slate-900 border border-slate-700
            rounded-2xl shadow-2xl flex flex-col overflow-hidden chat-slide-up"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Responder Chat</span>
              {threads.length > 0 && <span className="text-[10px] text-slate-500">{threads.length} active</span>}
            </div>
            <div className="flex items-center gap-1">
              {activeThread && (
                <button onClick={() => setActiveThread(null)} className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded transition-colors">← Back</button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0">
            {activeThread ? (
              <ConversationPane thread={activeThread} adminUser={adminUser} adminRole={adminRole} onBack={() => setActiveThread(null)} />
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto chat-scroll px-2 py-2">
                  {loadingThreads ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-center px-4">
                      <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-400">No active incidents</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">Chats appear here when reports or emergencies are assigned to responders.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {threads.some(t => t.unread > 0) && (
                        <>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Unread</p>
                          {threads.filter(t => t.unread > 0).map(t => <ThreadItem key={t.id} thread={t} onClick={() => setActiveThread(t)} />)}
                          <div className="h-px bg-slate-700/60 my-2 mx-3" />
                        </>
                      )}
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-1 pb-1">All Active Incidents</p>
                      {threads.map(t => <ThreadItem key={t.id} thread={t} onClick={() => setActiveThread(t)} />)}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 px-3 py-2 border-t border-slate-700/60">
                  <button onClick={loadThreads} className="w-full text-[10px] text-slate-600 hover:text-slate-300 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">↻ Refresh threads</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen]                       = useState(false);
  const [scrolled, setScrolled]                             = useState(false);
  const [userMenuOpen, setUserMenuOpen]                     = useState(false);
  const [alertPanelOpen, setAlertPanelOpen]                 = useState(false);
  const [user, setUser]                                     = useState(null);
  const [userRole, setUserRole]                             = useState(null);
  const [adminUser, setAdminUser]                           = useState(null); // ← new: full row for chat widget
  const [reportsDropdownOpen, setReportsDropdownOpen]       = useState(false);
  const [emergencyDropdownOpen, setEmergencyDropdownOpen]   = useState(false);
  const [adminAlerts, setAdminAlerts]                       = useState([]);
  const [unreadCount, setUnreadCount]                       = useState(0);
  const [urgentEmergenciesCount, setUrgentEmergenciesCount] = useState(0);

  const [emergencyToasts, setEmergencyToasts] = useState([]);
  const seenEmergencyIds                      = useRef(new Set());
  const isFirstEmergencyLoad                  = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();

  const isSysAdmin = userRole === 'system_administrator';

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

  useEffect(() => {
    const seedExistingEmergencies = async () => {
      const { data } = await supabase.from('emergencies').select('id').order('created_at', { ascending: false }).limit(100);
      (data || []).forEach(e => seenEmergencyIds.current.add(e.id));
      isFirstEmergencyLoad.current = false;
    };
    seedExistingEmergencies();
    requestNotifPermission();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('emergency-live-notifier')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergencies' }, (payload) => {
        const emergency = payload.new;
        if (isFirstEmergencyLoad.current)               return;
        if (seenEmergencyIds.current.has(emergency.id)) return;
        seenEmergencyIds.current.add(emergency.id);
        playAlertSound();
        showPushNotification(emergency);
        setEmergencyToasts(prev => [emergency, ...prev].slice(0, 4));
        fetchUrgentEmergencies();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const dismissToast           = useCallback((id) => setEmergencyToasts(prev => prev.filter(e => e.id !== id)), []);
  const viewEmergencyFromToast = useCallback((emergency) => navigate(`/emergency?emergencyId=${emergency.id}`), [navigate]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // ← Changed: select('*') instead of select('role') so chat widget gets full_name etc.
        const { data: adminData } = await supabase.from('admin_users').select('*').eq('auth_user_id', user.id).single();
        setUserRole(adminData?.role || null);
        setAdminUser(adminData || null); // ← new line
        fetchAdminAlerts(user.id);
        fetchUrgentEmergencies();
        subscribeToAdminAlerts(user.id);
        subscribeToEmergencies();
      }
    } catch (err) { console.error('Error getting user:', err); }
  };

  const fetchAdminAlerts = async (userId) => {
    try {
      const { data, error } = await supabase.from('admin_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      setAdminAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.is_read).length || 0);
    } catch (err) { console.error('Error fetching alerts:', err); }
  };

  const fetchUrgentEmergencies = async () => {
    try {
      const { count, error } = await supabase.from('emergencies').select('*', { count: 'exact', head: true }).in('severity', ['urgent', 'high']).eq('status', 'pending');
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
            Notification.requestPermission().then(p => { if (p === 'granted') new Notification(payload.new.title, { body: payload.new.message, icon: '/favicon.ico' }); });
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
    const channel = supabase.channel('emergencies-urgent').on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, fetchUrgentEmergencies).subscribe();
    return () => supabase.removeChannel(channel);
  };

  const handleMarkAsRead    = async (alert) => { try { await supabase.from('admin_alerts').update({ is_read: true }).eq('id', alert.id); setAlertPanelOpen(false); if (alert.link) navigate(alert.link); } catch (err) { console.error(err); } };
  const handleMarkAllAsRead = async () => { if (!user) return; try { await supabase.from('admin_alerts').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false); setUnreadCount(0); } catch (err) { console.error(err); } };
  const handleDeleteAlert   = async (alertId) => { try { await supabase.from('admin_alerts').delete().eq('id', alertId); } catch (err) { console.error(err); } };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === '/reports' || location.pathname === '/evidence') setReportsDropdownOpen(true);
    if (location.pathname === '/emergency' || location.pathname === '/emergency-evidence') setEmergencyDropdownOpen(true);
  }, [location.pathname]);

  const ALL_NAV_ITEMS = [
    { icon: Home,          label: 'Dashboard',    path: '/dashboard',     description: 'Overview'          },
    { icon: FileText,      label: 'Reports',      path: '/reports',       description: 'User reports',     hasDropdown: true, submenu: [{ icon: Camera, label: 'Evidence', path: '/evidence', description: 'Completion photos' }] },
    { icon: Bell,          label: 'Emergency',    path: '/emergency',     description: 'Active alerts',    badge: urgentEmergenciesCount, urgent: urgentEmergenciesCount > 0, hasDropdown: true, submenu: [{ icon: Camera, label: 'Evidence', path: '/emergency-evidence', description: 'Completion photos' }] },
    // { icon: Heart,         label: 'Medical',      path: '/medical',       description: 'Health requests'  },
    { icon: ClipboardList, label: 'Services',     path: '/services',      description: 'Document requests'},
    { icon: Users,         label: 'Residents',    path: '/residents',     description: 'Manage users',    sysAdminOnly: true },
    { icon: MessageSquare, label: 'Announcements',path: '/announcements', description: 'Community posts'  },
    { icon: BarChart3,     label: 'Analytics',    path: '/analytics',     description: 'Insights'         },
    { icon: Shield,        label: 'Audit Logs',   path: '/audit-logs',    description: 'Track actions',   sysAdminOnly: true },
    { icon: UserCog,       label: 'Admin Users',  path: '/admin-users',   description: 'Manage admins',   sysAdminOnly: true },
    { icon: Settings,      label: 'Settings',     path: '/settings',      description: 'Configure'        },
  ];

  const navItems          = ALL_NAV_ITEMS.filter(item => !item.sysAdminOnly || isSysAdmin);
  const RESTRICTED_PATHS  = ['/residents', '/audit-logs', '/admin-users'];
  const isRestrictedPage  = RESTRICTED_PATHS.includes(location.pathname);
  const showUnauthorized  = isRestrictedPage && userRole !== null && !isSysAdmin;

  const handleLogout = async () => {
    try {
      await logAuditAction({ action: 'logout', actionType: 'auth', description: `Admin logged out: ${user?.email}`, severity: 'info' });
      setUserMenuOpen(false);
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) { console.error('Logout error:', err); }
  };

  const isActive        = (path)    => location.pathname === path;
  const isSubmenuActive = (submenu) => submenu?.some(item => location.pathname === item.path) ?? false;
  const toggleDropdown  = (e, type) => { e.stopPropagation(); if (type === 'reports') setReportsDropdownOpen(p => !p); if (type === 'emergency') setEmergencyDropdownOpen(p => !p); };

  const userName    = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin User';
  const userEmail   = user?.email || 'admin@barangay.gov';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transform transition-all duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={EReportLogo} alt="E-Report Logo" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="font-bold text-white text-sm tracking-tight">E-Report+</h2>
              <p className="text-xs text-slate-400 font-medium">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {userRole && (
          <div className="flex-shrink-0 px-5 py-2.5 border-b border-slate-700/60">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isSysAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
              <Shield className="w-3 h-3" />
              {isSysAdmin ? 'System_administrator' : 'Operator'}
            </span>
          </div>
        )}

        <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Navigation</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active       = isActive(item.path);
              const hasActiveSub = isSubmenuActive(item.submenu);
              const showActive   = active || hasActiveSub;
              const dropOpen     = item.label === 'Reports' ? reportsDropdownOpen : item.label === 'Emergency' ? emergencyDropdownOpen : false;
              return (
                <div key={item.path}>
                  <button onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded transition-all duration-150 ${showActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-0.5 h-5 rounded-full flex-shrink-0 transition-all ${showActive ? 'bg-white' : 'bg-transparent'}`} />
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${showActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-semibold truncate ${showActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                        <p className={`text-xs truncate ${showActive ? 'text-slate-300' : 'text-slate-500'}`}>{item.description}</p>
                      </div>
                    </div>
                    {item.badge > 0 ? (
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${item.urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 text-slate-200'}`}>{item.badge > 9 ? '9+' : item.badge}</span>
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
                            className={`w-full group flex items-center gap-3 px-3 py-2 rounded transition-all text-left ${subActive ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
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

        <div className="flex-shrink-0 p-3 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-all group">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        <header className={`bg-white border-b border-slate-200 sticky top-0 z-30 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:bg-slate-100 p-2 rounded transition-all"><Menu className="w-5 h-5" /></button>
              <div>
                <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-widest font-semibold">
                  {navItems.find(i => i.path === location.pathname)?.description || ALL_NAV_ITEMS.flatMap(i => i.submenu || []).find(s => s.path === location.pathname)?.description || 'Overview'}
                </div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {navItems.find(i => i.path === location.pathname)?.label || ALL_NAV_ITEMS.flatMap(i => i.submenu || []).find(s => s.path === location.pathname)?.label || 'Dashboard'}
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
                      <span className="absolute top-1 right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white"></span></span>
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </>
                  )}
                </button>
                {alertPanelOpen && <AlertPanel alerts={adminAlerts} onClose={() => setAlertPanelOpen(false)} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onDelete={handleDeleteAlert} />}
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
                          <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${isSysAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            <Shield className="w-3 h-3" />
                            {isSysAdmin ? 'System Admin' : 'Operator'}
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"><Settings className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs font-medium">Account Settings</span></button>
                        <button onClick={() => { setUserMenuOpen(false); navigate('/help'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"><HelpCircle className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs font-medium">Help & Support</span></button>
                      </div>
                      <div className="border-t border-slate-100">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Logout</span></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

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

      {/* ── Emergency Toast Stack (top-right) ── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {emergencyToasts.map((emergency) => (
          <div key={emergency.id} className="pointer-events-auto">
            <EmergencyToast emergency={emergency} onDismiss={dismissToast} onView={viewEmergencyFromToast} />
          </div>
        ))}
      </div>

      {/*
        ── Global Floating Chat Widget ──────────────────────────────────────────
        Renders a fixed bottom-right button on EVERY page inside this layout.
        The button opens a slide-up panel listing all active incident threads.
        adminUser must be the full admin_users row (needs auth_user_id + full_name).
      */}
      <GlobalChatWidget adminUser={adminUser} adminRole={userRole} />

    </div>
  );
}