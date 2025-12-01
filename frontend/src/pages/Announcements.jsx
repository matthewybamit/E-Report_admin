// src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  X,
  Radio,
  Image as ImageIcon,
  Send,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Bell,
  Pin,
  TrendingUp,
  MoreVertical,
  Calendar,
  Tag,
  Zap,
  AlertCircle,
  CheckCircle,
  Filter,
  SortDesc,
  Upload,
  Type,
  Sparkles,
  Megaphone,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../config/supabase';

// Category Config (keep the same)
const categoryConfig = {
  Emergency: { color: 'red', icon: '🚨', gradient: 'from-red-500 to-red-600' },
  Community: { color: 'purple', icon: '👥', gradient: 'from-purple-500 to-purple-600' },
  Health: { color: 'green', icon: '🏥', gradient: 'from-green-500 to-green-600' },
  Meeting: { color: 'blue', icon: '📅', gradient: 'from-blue-500 to-blue-600' },
  Weather: { color: 'orange', icon: '🌧️', gradient: 'from-orange-500 to-orange-600' },
  Notice: { color: 'yellow', icon: '📢', gradient: 'from-yellow-500 to-yellow-600' },
  Safety: { color: 'indigo', icon: '🛡️', gradient: 'from-indigo-500 to-indigo-600' },
  Announcements: { color: 'blue', icon: '📢', gradient: 'from-blue-500 to-blue-600' },
  Alerts: { color: 'red', icon: '⚠️', gradient: 'from-red-500 to-red-600' },
  Events: { color: 'purple', icon: '🎉', gradient: 'from-purple-500 to-purple-600' },
  Updates: { color: 'green', icon: '🔔', gradient: 'from-green-500 to-green-600' },
};

// Toast, PriorityBadge, CategoryBadge components (keep the same as before)
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-4 right-4 ${styles[type]} text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 max-w-md`}>
      {type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
      <span className="font-semibold flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const config = {
    emergency: { bg: 'bg-red-500', text: 'text-white', label: 'BREAKING', icon: Zap, pulse: true },
    important: { bg: 'bg-orange-500', text: 'text-white', label: 'IMPORTANT', icon: AlertCircle, pulse: false },
    normal: { bg: 'bg-gray-500', text: 'text-white', label: 'REGULAR', icon: Bell, pulse: false },
  };

  const style = config[priority] || config.normal;
  const Icon = style.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-md ${style.bg} ${style.text} text-xs font-bold ${style.pulse ? 'animate-pulse' : ''}`}>
      <Icon className="w-3 h-3 mr-1" />
      {style.label}
    </div>
  );
}

function CategoryBadge({ category }) {
  const config = categoryConfig[category] || categoryConfig.Notice;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-${config.color}-100 text-${config.color}-800 text-xs font-bold border border-${config.color}-200`}>
      <span className="mr-1.5">{config.icon}</span>
      {category}
    </div>
  );
}

// AnnouncementCard, AnnouncementDetailsModal, CreateAnnouncementModal (keep the same as previous version)
function AnnouncementCard({ announcement, onClick, onEdit, onDelete }) {
  const categoryStyle = categoryConfig[announcement.category] || categoryConfig.Notice;
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-gray-200 cursor-pointer"
      onClick={onClick}
    >
      {announcement.image_url ? (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {announcement.is_pinned && (
              <div className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center shadow-lg">
                <Pin className="w-3 h-3 mr-1" />
                PINNED
              </div>
            )}
            <PriorityBadge priority={announcement.priority} />
          </div>
        </div>
      ) : (
        <div className={`relative h-48 bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center`}>
          <div className="text-7xl opacity-30">{categoryStyle.icon}</div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {announcement.is_pinned && (
              <div className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center shadow-lg">
                <Pin className="w-3 h-3 mr-1" />
                PINNED
              </div>
            )}
            <PriorityBadge priority={announcement.priority} />
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <CategoryBadge category={announcement.category} />
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo(announcement.created_at)}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {announcement.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {announcement.content}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="font-semibold">{announcement.view_count?.toLocaleString() || 0}</span>
            <span className="ml-1">views</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(announcement);
              }}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(announcement);
              }}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementDetailsModal({ announcement, onClose }) {
  if (!announcement) return null;

  const categoryStyle = categoryConfig[announcement.category] || categoryConfig.Notice;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {announcement.image_url ? (
          <div className="relative h-80 overflow-hidden">
            <img 
              src={announcement.image_url} 
              alt={announcement.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 left-8 right-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <CategoryBadge category={announcement.category} />
                <PriorityBadge priority={announcement.priority} />
                {announcement.is_pinned && (
                  <div className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center">
                    <Pin className="w-3 h-3 mr-1" />
                    PINNED
                  </div>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{announcement.title}</h1>
            </div>
          </div>
        ) : (
          <div className={`relative bg-gradient-to-br ${categoryStyle.gradient} p-8`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <CategoryBadge category={announcement.category} />
              <PriorityBadge priority={announcement.priority} />
              {announcement.is_pinned && (
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center">
                  <Pin className="w-3 h-3 mr-1" />
                  PINNED
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{announcement.title}</h1>
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(90vh-400px)] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{new Date(announcement.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 shrink-0" />
              {announcement.view_count?.toLocaleString() || 0} views
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{announcement.author}</span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-base sm:text-lg text-gray-800 leading-relaxed whitespace-pre-line">{announcement.content}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-6 sm:px-8 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAnnouncementModal({ onClose, onSuccess, editData = null }) {
  const [selectedCategory, setSelectedCategory] = useState(editData?.category || '');
  const [selectedPriority, setSelectedPriority] = useState(editData?.priority || 'normal');
  const [title, setTitle] = useState(editData?.title || '');
  const [content, setContent] = useState(editData?.content || '');
  const [imageUrl, setImageUrl] = useState(editData?.image_url || '');
  const [isPinned, setIsPinned] = useState(editData?.is_pinned || false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !content || !selectedCategory) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title,
            content,
            category: selectedCategory,
            priority: selectedPriority,
            image_url: imageUrl || null,
            is_pinned: isPinned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([
            {
              title,
              content,
              category: selectedCategory,
              priority: selectedPriority,
              author: 'Barangay Admin',
              image_url: imageUrl || null,
              is_pinned: isPinned,
              view_count: 0,
            },
          ]);

        if (error) throw error;
      }

      onSuccess(editData ? 'updated' : 'created');
      onClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 sm:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shrink-0">
                <Radio className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {editData ? 'Edit Announcement' : 'Broadcast New Announcement'}
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">
                  {editData ? 'Update announcement details' : 'Create and publish to all residents'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all disabled:opacity-50 shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 sm:p-8 space-y-6">
          <div>
            <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
              <Type className="w-4 h-4 mr-2" />
              Headline *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-lg sm:text-xl border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-gray-400 placeholder:font-normal disabled:bg-gray-100"
              placeholder="Enter announcement headline..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
                <Tag className="w-4 h-4 mr-2" />
                Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(categoryConfig).map((cat) => {
                  const config = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      disabled={loading}
                      className={`p-3 sm:p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                        selectedCategory === cat
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{config.icon}</div>
                      <div className="text-xs font-bold text-gray-700 truncate">{cat}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
                <Zap className="w-4 h-4 mr-2" />
                Priority Level *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'emergency', label: 'Emergency Broadcast', desc: 'Critical and urgent' },
                  { value: 'important', label: 'Important Notice', desc: 'Requires attention' },
                  { value: 'normal', label: 'Regular Announcement', desc: 'Standard update' },
                ].map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setSelectedPriority(priority.value)}
                    disabled={loading}
                    className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${
                      selectedPriority === priority.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">{priority.label}</div>
                        <div className="text-xs text-gray-600 mt-1 truncate">{priority.desc}</div>
                      </div>
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={selectedPriority === priority.value}
                        onChange={() => {}}
                        className="w-4 h-4 shrink-0"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
              <Edit3 className="w-4 h-4 mr-2" />
              Message Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-relaxed placeholder:text-gray-400 disabled:bg-gray-100"
              rows="8"
              placeholder="Write your announcement message here. Be clear, concise, and informative..."
            ></textarea>
          </div>

          <div>
            <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
              <ImageIcon className="w-4 h-4 mr-2" />
              Image URL (Optional)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={loading}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-2">Recommended: 1200x600px • Direct image link</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <input
                type="checkbox"
                id="pin"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                disabled={loading}
                className="w-5 h-5 rounded accent-yellow-500 disabled:opacity-50 shrink-0"
              />
              <label htmlFor="pin" className="ml-3 flex-1 font-bold text-sm text-gray-800 flex items-center min-w-0">
                <Pin className="w-4 h-4 mr-2 text-yellow-600 shrink-0" />
                <span className="truncate">Pin to top of feed</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-6 sm:px-8 py-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 sm:px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title || !content || !selectedCategory}
            className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="truncate">{editData ? 'Updating...' : 'Publishing...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">{editData ? 'Update Announcement' : 'Publish Broadcast'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// MAIN COMPONENT - COMPLETE FIX
export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err.message);
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (announcement) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;

      showToast('Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Failed to delete announcement', 'error');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setCreateModalOpen(true);
  };

  const handleModalSuccess = (action) => {
    showToast(
      action === 'updated' 
        ? 'Announcement updated successfully!' 
        : 'Announcement published successfully!',
      'success'
    );
    fetchAnnouncements();
  };

  const breakingNews = announcements.filter((a) => a.is_pinned && a.priority !== 'normal');

  const filteredAnnouncements = announcements
    .filter((a) => selectedCategory === 'All' || a.category === selectedCategory)
    .filter((a) => 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {breakingNews.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg rounded-xl p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white text-red-600 px-2 sm:px-3 py-1 rounded-md text-xs font-bold flex items-center animate-pulse shrink-0">
              <Zap className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">BREAKING</span>
              <span className="sm:hidden">!</span>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {breakingNews.map((news, i) => (
                  <div key={news.id} className="flex items-center shrink-0">
                    {i > 0 && <span className="mx-2 sm:mx-4 text-red-300">•</span>}
                    <button
                      onClick={() => {
                        setSelectedAnnouncement(news);
                        setDetailsModalOpen(true);
                      }}
                      className="text-xs sm:text-sm font-bold hover:underline whitespace-nowrap"
                    >
                      {news.title}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 w-full sm:flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg shrink-0">
              <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Broadcasting Center</h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Newsroom & Announcements</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Create Broadcast</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Broadcasts', value: announcements.length, icon: Radio, gradient: 'from-blue-500 to-indigo-600' },
          { label: 'Active', value: announcements.filter((a) => a.priority !== 'normal').length, icon: Zap, gradient: 'from-orange-500 to-red-600' },
          { label: 'Total Views', value: announcements.reduce((sum, a) => sum + (a.view_count || 0), 0), icon: Users, gradient: 'from-purple-500 to-pink-600' },
          { label: 'Pinned', value: announcements.filter((a) => a.is_pinned).length, icon: Pin, gradient: 'from-yellow-500 to-amber-600' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border-2 border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`bg-gradient-to-br ${stat.gradient} p-2 rounded-lg shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide truncate">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search broadcasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
            />
          </div>

          <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 w-max min-w-full">
              {['All', ...Object.keys(categoryConfig)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat !== 'All' && <span className="mr-1">{categoryConfig[cat]?.icon}</span>}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-md">
          <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold mb-2">
            {searchTerm || selectedCategory !== 'All' 
              ? 'No announcements found' 
              : 'No announcements yet'}
          </p>
          <p className="text-gray-500 mb-6 px-4">
            {searchTerm || selectedCategory !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Create your first announcement to get started!'}
          </p>
          {!searchTerm && selectedCategory === 'All' && (
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setCreateModalOpen(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Create First Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onClick={() => {
                setSelectedAnnouncement(announcement);
                setDetailsModalOpen(true);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {createModalOpen && (
        <CreateAnnouncementModal
          onClose={() => {
            setCreateModalOpen(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={handleModalSuccess}
          editData={editingAnnouncement}
        />
      )}

      {detailsModalOpen && selectedAnnouncement && (
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedAnnouncement(null);
          }}
        />
      )}
    </div>
  );
}
