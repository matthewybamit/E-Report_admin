// src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import {
  Search, Eye, Edit3, Trash2, X, Radio, Image as ImageIcon,
  Send, Clock, Users, Plus, Bell, Pin, TrendingUp, Calendar,
  Tag, Zap, AlertCircle, CheckCircle, RefreshCw, Type,
  Megaphone, Activity,
} from 'lucide-react';
import { supabase } from '../config/supabase';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  Emergency:     { icon: '🚨', color: 'red'    },
  Community:     { icon: '👥', color: 'purple' },
  Health:        { icon: '🏥', color: 'green'  },
  Meeting:       { icon: '📅', color: 'blue'   },
  Weather:       { icon: '🌧️', color: 'orange' },
  Notice:        { icon: '📢', color: 'yellow' },
  Safety:        { icon: '🛡️', color: 'indigo' },
  Announcements: { icon: '📢', color: 'blue'   },
  Alerts:        { icon: '⚠️', color: 'red'    },
  Events:        { icon: '🎉', color: 'purple' },
  Updates:       { icon: '🔔', color: 'green'  },
};

const PRIORITY_CONFIG = {
  emergency: { label: 'BREAKING',  style: 'bg-red-50 text-red-700 border-red-300',    pulse: true  },
  important: { label: 'IMPORTANT', style: 'bg-amber-50 text-amber-700 border-amber-300', pulse: false },
  normal:    { label: 'REGULAR',   style: 'bg-slate-50 text-slate-600 border-slate-300', pulse: false },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold uppercase tracking-wider ${cfg.style} ${cfg.pulse ? 'animate-pulse' : ''}`}>
      {priority === 'emergency' && <Zap className="w-3 h-3" />}
      {priority === 'important' && <AlertCircle className="w-3 h-3" />}
      {priority === 'normal'    && <Bell className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Notice;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold bg-slate-50 text-slate-600 border-slate-300">
      <span>{cfg.icon}</span>{category}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded border shadow-lg text-sm font-semibold max-w-sm ${
      type === 'success' ? 'bg-green-50 text-green-800 border-green-300' :
      type === 'error'   ? 'bg-red-50 text-red-800 border-red-300' :
                           'bg-blue-50 text-blue-800 border-blue-300'
    }`}>
      {type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      {type === 'error'   && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-60 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, onClick, onEdit, onDelete }) {
  const cfg = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG.Notice;
  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {/* Image or colored header */}
      {announcement.image_url ? (
        <div className="relative h-40 overflow-hidden bg-slate-100">
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {announcement.is_pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold bg-amber-50 text-amber-700 border-amber-300">
                <Pin className="w-3 h-3" />Pinned
              </span>
            )}
            <PriorityBadge priority={announcement.priority} />
          </div>
        </div>
      ) : (
        <div className="relative h-40 bg-slate-800 flex items-center justify-center overflow-hidden">
          <span className="text-6xl opacity-20">{cfg.icon}</span>
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {announcement.is_pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold bg-amber-50 text-amber-700 border-amber-300">
                <Pin className="w-3 h-3" />Pinned
              </span>
            )}
            <PriorityBadge priority={announcement.priority} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={announcement.category} />
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />{timeAgo(announcement.created_at)}
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-600 transition-colors">
          {announcement.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{announcement.content}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold">{(announcement.view_count || 0).toLocaleString()}</span> views
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onEdit(announcement); }}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(announcement); }}
              className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Details Modal ────────────────────────────────────────────────────────────
function AnnouncementDetailsModal({ announcement, onClose }) {
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={announcement.category} />
                <PriorityBadge priority={announcement.priority} />
                {announcement.is_pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold bg-amber-50 text-amber-700 border-amber-300">
                    <Pin className="w-3 h-3" />Pinned
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold text-white mt-2 leading-snug">{announcement.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        {announcement.image_url && (
          <div className="h-56 overflow-hidden flex-shrink-0">
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />
              {new Date(announcement.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{(announcement.view_count || 0).toLocaleString()} views</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />{announcement.author}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{announcement.content}</p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function CreateAnnouncementModal({ onClose, onSuccess, editData = null }) {
  const [form, setForm] = useState({
    title:    editData?.title     || '',
    content:  editData?.content   || '',
    category: editData?.category  || '',
    priority: editData?.priority  || 'normal',
    imageUrl: editData?.image_url || '',
    isPinned: editData?.is_pinned || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.category) {
      setError('Title, content and category are required.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title:     form.title,
        content:   form.content,
        category:  form.category,
        priority:  form.priority,
        image_url: form.imageUrl || null,
        is_pinned: form.isPinned,
        updated_at: new Date().toISOString(),
      };
      if (editData) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert([{ ...payload, author: 'Barangay Admin', view_count: 0 }]);
        if (error) throw error;
      }
      onSuccess(editData ? 'updated' : 'created');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              {editData ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {editData ? 'Update announcement details' : 'Broadcast to all residents'}
            </p>
          </div>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Headline *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              disabled={loading}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50"
              placeholder="Enter announcement headline..."
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Category *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, category: cat }))}
                    disabled={loading}
                    className={`p-2 rounded border text-left transition-all disabled:opacity-50 ${
                      form.category === cat
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{cfg.icon}</div>
                    <div className={`text-xs font-bold truncate ${form.category === cat ? 'text-white' : 'text-slate-700'}`}>{cat}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Priority *</label>
              <div className="space-y-2">
                {[
                  { value: 'emergency', label: 'Emergency Broadcast', desc: 'Critical and urgent' },
                  { value: 'important', label: 'Important Notice',    desc: 'Requires attention'  },
                  { value: 'normal',    label: 'Regular Update',      desc: 'Standard update'     },
                ].map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                    disabled={loading}
                    className={`w-full p-3 rounded border text-left transition-all disabled:opacity-50 ${
                      form.priority === p.value
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-xs font-bold ${form.priority === p.value ? 'text-white' : 'text-slate-900'}`}>{p.label}</p>
                    <p className={`text-xs mt-0.5 ${form.priority === p.value ? 'text-slate-300' : 'text-slate-500'}`}>{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Message Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              disabled={loading}
              rows={5}
              placeholder="Write your announcement message..."
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none disabled:opacity-50"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              Image URL <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
              disabled={loading}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-slate-400 mt-1">Recommended: 1200×600px · Direct image link</p>
          </div>

          {/* Pin */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <input
              type="checkbox"
              id="pin-check"
              checked={form.isPinned}
              onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
              disabled={loading}
              className="w-4 h-4 rounded accent-slate-700 disabled:opacity-50"
            />
            <label htmlFor="pin-check" className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <Pin className="w-3.5 h-3.5 text-amber-600" />Pin to top of feed
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2 flex-shrink-0">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !form.title || !form.content || !form.category}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{editData ? 'Updating...' : 'Publishing...'}</>
              : <><Send className="w-3.5 h-3.5" />{editData ? 'Update Announcement' : 'Publish Broadcast'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Announcements() {
  const [announcements, setAnnouncements]         = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailsModal, setDetailsModal]           = useState(false);
  const [createModal, setCreateModal]             = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm]               = useState('');
  const [selectedCategory, setSelectedCategory]   = useState('All');
  const [loading, setLoading]                     = useState(true);
  const [toast, setToast]                         = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleDelete = async (announcement) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcement.id);
      if (error) throw error;
      showToast('Announcement deleted.');
      fetchAnnouncements();
    } catch { showToast('Failed to delete.', 'error'); }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setCreateModal(true);
  };

  const handleModalSuccess = (action) => {
    showToast(action === 'updated' ? 'Announcement updated!' : 'Announcement published!');
    fetchAnnouncements();
  };

  const breakingNews = announcements.filter(a => a.is_pinned && a.priority !== 'normal');

  const filtered = announcements
    .filter(a => selectedCategory === 'All' || a.category === selectedCategory)
    .filter(a =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Breaking News Banner */}
      {breakingNews.length > 0 && (
        <div className="bg-red-600 border border-red-700 rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-red-600 rounded text-xs font-bold flex-shrink-0 animate-pulse">
            <Zap className="w-3 h-3" />BREAKING
          </span>
          <div className="flex-1 overflow-x-auto flex items-center gap-3 scrollbar-hide">
            {breakingNews.map((n, i) => (
              <span key={n.id} className="flex items-center flex-shrink-0">
                {i > 0 && <span className="mx-2 text-red-300">•</span>}
                <button
                  onClick={() => { setSelectedAnnouncement(n); setDetailsModal(true); }}
                  className="text-xs font-bold text-white hover:underline whitespace-nowrap"
                >
                  {n.title}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Radio className="w-3.5 h-3.5" />Broadcasting Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and broadcast to all residents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAnnouncements} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button onClick={() => { setEditingAnnouncement(null); setCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors shadow-sm">
            <Plus className="w-4 h-4" />Create Broadcast
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Broadcasts', value: announcements.length,                                              color: 'text-slate-700' },
          { label: 'Priority',         value: announcements.filter(a => a.priority !== 'normal').length,         color: 'text-amber-600' },
          { label: 'Total Views',      value: announcements.reduce((s, a) => s + (a.view_count || 0), 0),        color: 'text-blue-600'  },
          { label: 'Pinned',           value: announcements.filter(a => a.is_pinned).length,                     color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search broadcasts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...Object.keys(CATEGORY_CONFIG)].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat !== 'All' && <span>{CATEGORY_CONFIG[cat]?.icon}</span>}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm text-center py-16">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {searchTerm || selectedCategory !== 'All' ? 'No announcements found' : 'No announcements yet'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm || selectedCategory !== 'All'
              ? 'Try adjusting your search or filters.'
              : 'Create your first broadcast to get started.'}
          </p>
          {!searchTerm && selectedCategory === 'All' && (
            <button
              onClick={() => { setEditingAnnouncement(null); setCreateModal(true); }}
              className="mt-4 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors"
            >
              Create First Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onClick={() => { setSelectedAnnouncement(a); setDetailsModal(true); }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {createModal && (
        <CreateAnnouncementModal
          onClose={() => { setCreateModal(false); setEditingAnnouncement(null); }}
          onSuccess={handleModalSuccess}
          editData={editingAnnouncement}
        />
      )}
      {detailsModal && selectedAnnouncement && (
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          onClose={() => { setDetailsModal(false); setSelectedAnnouncement(null); }}
        />
      )}
    </div>
  );
}
