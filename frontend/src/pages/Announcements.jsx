// src/pages/Announcements.jsx
import { useState } from 'react';
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
} from 'lucide-react';

// Mock Announcements Data
const mockAnnouncements = [
  {
    id: 'ANN-2025-001',
    title: 'URGENT: Water Supply Interruption Tomorrow',
    category: 'Emergency',
    content: 'Water supply will be temporarily interrupted on November 18, 2025 from 8:00 AM to 5:00 PM due to pipeline maintenance. Please store water in advance. Affected areas: All zones.',
    author: 'Barangay Admin - Maria Santos',
    publishedOn: '2025-11-15T14:30:00',
    priority: 'emergency',
    viewCount: 1247,
    isPinned: true,
    imageUrl: 'https://images.unsplash.com/photo-1584267469232-c7b3ada1a9ae?w=800&h=400&fit=crop',
  },
  {
    id: 'ANN-2025-002',
    title: 'Community Clean-up Drive This Saturday',
    category: 'Community',
    content: 'Join us this Saturday for a community-wide clean-up drive. Let\'s keep our barangay clean and green! Meeting point at the Barangay Hall at 6:00 AM. Bring your own gloves and bags. Free breakfast for all volunteers!',
    author: 'Barangay Captain - Juan Dela Cruz',
    publishedOn: '2025-11-15T09:00:00',
    priority: 'important',
    viewCount: 856,
    isPinned: true,
    imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&h=400&fit=crop',
  },
  {
    id: 'ANN-2025-003',
    title: 'Free Medical Check-up for Senior Citizens',
    category: 'Health',
    content: 'Free medical check-up and consultation will be available at the Barangay Health Center every Monday and Wednesday from 9:00 AM to 12:00 PM. Please bring your senior citizen ID.',
    author: 'Health Officer - Dr. Ana Reyes',
    publishedOn: '2025-11-14T10:15:00',
    priority: 'normal',
    viewCount: 423,
    isPinned: false,
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
  },
  {
    id: 'ANN-2025-004',
    title: 'Barangay Assembly Meeting - November 25',
    category: 'Meeting',
    content: 'Quarterly Barangay Assembly will be held on November 25, 2025 at 2:00 PM at the covered court. All residents are encouraged to attend. Agenda includes budget presentation and community projects.',
    author: 'Barangay Secretary - Pedro Garcia',
    publishedOn: '2025-11-13T16:45:00',
    priority: 'important',
    viewCount: 634,
    isPinned: false,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
  },
  {
    id: 'ANN-2025-005',
    title: 'Weather Advisory: Heavy Rainfall Expected',
    category: 'Weather',
    content: 'Heavy rainfall is expected in our area for the next 48 hours. Please stay safe and avoid low-lying areas prone to flooding. Emergency hotlines are available 24/7.',
    author: 'Disaster Risk Office',
    publishedOn: '2025-11-12T08:20:00',
    priority: 'emergency',
    viewCount: 1523,
    isPinned: false,
    imageUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&h=400&fit=crop',
  },
  {
    id: 'ANN-2025-006',
    title: 'Holiday Garbage Collection Schedule',
    category: 'Notice',
    content: 'Garbage collection schedule during the holidays: No collection on November 30. Regular schedule resumes on December 2. Please coordinate with your zone representatives.',
    author: 'Sanitation Officer - Carlos Lopez',
    publishedOn: '2025-11-11T11:20:00',
    priority: 'normal',
    viewCount: 789,
    isPinned: false,
    imageUrl: null,
  },
];

// Category Config
const categoryConfig = {
  Emergency: { color: 'red', icon: '🚨', gradient: 'from-red-500 to-red-600' },
  Community: { color: 'purple', icon: '👥', gradient: 'from-purple-500 to-purple-600' },
  Health: { color: 'green', icon: '🏥', gradient: 'from-green-500 to-green-600' },
  Meeting: { color: 'blue', icon: '📅', gradient: 'from-blue-500 to-blue-600' },
  Weather: { color: 'orange', icon: '🌧️', gradient: 'from-orange-500 to-orange-600' },
  Notice: { color: 'yellow', icon: '📢', gradient: 'from-yellow-500 to-yellow-600' },
  Safety: { color: 'indigo', icon: '🛡️', gradient: 'from-indigo-500 to-indigo-600' },
};

// Priority Badge
function PriorityBadge({ priority }) {
  const config = {
    emergency: { bg: 'bg-red-500', text: 'text-white', label: 'BREAKING', icon: Zap, pulse: true },
    important: { bg: 'bg-orange-500', text: 'text-white', label: 'IMPORTANT', icon: AlertCircle, pulse: false },
    normal: { bg: 'bg-gray-500', text: 'text-white', label: 'REGULAR', icon: Bell, pulse: false },
  };

  const style = config[priority];
  const Icon = style.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-md ${style.bg} ${style.text} text-xs font-bold ${style.pulse ? 'animate-pulse' : ''}`}>
      <Icon className="w-3 h-3 mr-1" />
      {style.label}
    </div>
  );
}

// Category Badge
function CategoryBadge({ category }) {
  const config = categoryConfig[category] || categoryConfig.Notice;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-${config.color}-100 text-${config.color}-800 text-xs font-bold border border-${config.color}-200`}>
      <span className="mr-1.5">{config.icon}</span>
      {category}
    </div>
  );
}

// Announcement Card Component
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
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-gray-200 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
      onClick={onClick}
    >
      {/* Image/Thumbnail */}
      {announcement.imageUrl ? (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {announcement.isPinned && (
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
            {announcement.isPinned && (
              <div className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center shadow-lg">
                <Pin className="w-3 h-3 mr-1" />
                PINNED
              </div>
            )}
            <PriorityBadge priority={announcement.priority} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category & Time */}
        <div className="flex items-center justify-between">
          <CategoryBadge category={announcement.category} />
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo(announcement.publishedOn)}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {announcement.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {announcement.content}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="font-semibold">{announcement.viewCount.toLocaleString()}</span>
            <span className="ml-1">views</span>
          </div>

          {/* Actions */}
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

// Create Announcement Composer Modal
function CreateAnnouncementModal({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Radio className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Broadcast New Announcement</h2>
                <p className="text-blue-100 text-sm mt-1">Create and publish to all residents</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
              <Type className="w-4 h-4 mr-2" />
              Headline
            </label>
            <input
              type="text"
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-gray-400 placeholder:font-normal"
              placeholder="Enter announcement headline..."
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
                <Tag className="w-4 h-4 mr-2" />
                Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(categoryConfig).map((cat) => {
                  const config = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedCategory === cat
                          ? `border-${config.color}-500 bg-${config.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.icon}</div>
                      <div className="text-xs font-bold text-gray-700">{cat}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
                <Zap className="w-4 h-4 mr-2" />
                Priority Level
              </label>
              <div className="space-y-3">
                {[
                  { value: 'emergency', label: 'Emergency Broadcast', color: 'red' },
                  { value: 'important', label: 'Important Notice', color: 'orange' },
                  { value: 'normal', label: 'Regular Announcement', color: 'gray' },
                ].map((priority) => (
                  <div
                    key={priority.value}
                    className={`p-4 rounded-xl border-2 border-${priority.color}-300 bg-${priority.color}-50 hover:bg-${priority.color}-100 transition-all cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{priority.label}</span>
                      <input type="radio" name="priority" value={priority.value} className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
              <Edit3 className="w-4 h-4 mr-2" />
              Message Content
            </label>
            <textarea
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-relaxed placeholder:text-gray-400"
              rows="8"
              placeholder="Write your announcement message here. Be clear, concise, and informative..."
            ></textarea>
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-800 mb-3">
              <ImageIcon className="w-4 h-4 mr-2" />
              Featured Image (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Drop image here or click to upload</p>
              <p className="text-xs text-gray-500">Recommended: 1200x600px • Max 5MB</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <input type="checkbox" id="pin" className="w-5 h-5 rounded accent-yellow-500" />
              <label htmlFor="pin" className="ml-3 flex-1 font-bold text-sm text-gray-800 flex items-center">
                <Pin className="w-4 h-4 mr-2 text-yellow-600" />
                Pin to top of feed
              </label>
            </div>

            <div className="flex items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <input type="checkbox" className="w-5 h-5 rounded accent-blue-500" defaultChecked />
              <label className="ml-3 flex-1">
                <div className="font-bold text-sm text-gray-800 flex items-center">
                  <Bell className="w-4 h-4 mr-2 text-blue-600" />
                  Send push notification
                </div>
                <p className="text-xs text-gray-600 mt-1">All residents will receive instant notification</p>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-5 flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Cancel
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg">
            <Send className="w-5 h-5" />
            <span>Publish Broadcast</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Announcement Details Modal
function AnnouncementDetailsModal({ announcement, onClose }) {
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Hero Image */}
        {announcement.imageUrl ? (
          <div className="relative h-80 overflow-hidden">
            <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 left-8 right-8">
              <div className="flex items-center gap-3 mb-4">
                <CategoryBadge category={announcement.category} />
                <PriorityBadge priority={announcement.priority} />
                {announcement.isPinned && (
                  <div className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center">
                    <Pin className="w-3 h-3 mr-1" />
                    PINNED
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight">{announcement.title}</h1>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={announcement.category} />
              <PriorityBadge priority={announcement.priority} />
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">{announcement.title}</h1>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-400px)] p-8 space-y-6">
          {/* Meta */}
          <div className="flex items-center gap-6 text-sm text-gray-600 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(announcement.publishedOn).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {announcement.viewCount.toLocaleString()} views
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              {announcement.author}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-line">{announcement.content}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Close
          </button>
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all">
            Edit Announcement
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function Announcements() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const handleViewDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailsModalOpen(true);
  };

  // Breaking news (pinned emergency/important)
  const breakingNews = mockAnnouncements.filter((a) => a.isPinned && a.priority !== 'normal');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Breaking News Banner */}
      {breakingNews.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center gap-4 animate-in slide-in-from-top duration-500">
              <div className="bg-white text-red-600 px-3 py-1 rounded-md text-xs font-bold flex items-center animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                BREAKING
              </div>
              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                {breakingNews.map((news, i) => (
                  <div key={news.id} className="flex items-center">
                    {i > 0 && <span className="mx-4 text-red-300">•</span>}
                    <button
                      onClick={() => handleViewDetails(news)}
                      className="text-sm font-bold hover:underline whitespace-nowrap"
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

      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <Radio className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Broadcasting Center</h1>
                <p className="text-gray-600 mt-1 font-medium">Newsroom & Announcements Management</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            <span>Create Broadcast</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Broadcasts', value: mockAnnouncements.length, icon: Radio, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Active', value: mockAnnouncements.filter((a) => a.priority !== 'normal').length, icon: Zap, gradient: 'from-orange-500 to-red-600' },
            { label: 'Total Reach', value: '12.4K', icon: Users, gradient: 'from-purple-500 to-pink-600' },
            { label: 'Pinned', value: mockAnnouncements.filter((a) => a.isPinned).length, icon: Pin, gradient: 'from-yellow-500 to-amber-600' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">{stat.label}</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search broadcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {['All', ...Object.keys(categoryConfig)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat !== 'All' && categoryConfig[cat]?.icon} {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Viewed</option>
              <option value="pinned">Pinned</option>
            </select>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onClick={() => handleViewDetails(announcement)}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {createModalOpen && <CreateAnnouncementModal onClose={() => setCreateModalOpen(false)} />}
      {detailsModalOpen && (
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          onClose={() => setDetailsModalOpen(false)}
        />
      )}
    </div>
  );
}
