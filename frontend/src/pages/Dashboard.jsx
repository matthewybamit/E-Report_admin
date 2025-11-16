import { Home, FileText, Users, Bell, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { 
      title: 'Total Reports', 
      value: '156', 
      change: '+12%', 
      icon: FileText, 
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      title: 'Active Users', 
      value: '1,234', 
      change: '+8%', 
      icon: Users, 
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      title: 'Active Emergencies', 
      value: '3', 
      change: 'Critical', 
      icon: Bell, 
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    { 
      title: 'Resolved Today', 
      value: '24', 
      change: '+15%', 
      icon: CheckCircle, 
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
  ];

  const recentActivity = [
    { id: 1, type: 'report', title: 'New concern reported', desc: 'Broken streetlight on Main St.', time: '5 min ago', status: 'pending' },
    { id: 2, type: 'emergency', title: 'Emergency alert', desc: 'Medical assistance needed', time: '12 min ago', status: 'urgent' },
    { id: 3, type: 'resolved', title: 'Issue resolved', desc: 'Garbage collection completed', time: '1 hour ago', status: 'resolved' },
    { id: 4, type: 'user', title: 'New user registered', desc: 'John Doe joined', time: '2 hours ago', status: 'info' },
  ];

  const pendingReports = [
    { id: 1, category: 'Infrastructure', title: 'Broken Street Light', location: 'Main St, Block 5', date: '2 hours ago', priority: 'medium' },
    { id: 2, category: 'Health', title: 'Medical Assistance', location: 'Zone 3, House 12', date: '5 hours ago', priority: 'high' },
    { id: 3, category: 'Safety', title: 'Noise Complaint', location: 'Block 2, Unit 5', date: '1 day ago', priority: 'low' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className={`text-sm mt-2 font-semibold ${stat.color === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.bgColor} p-4 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.status === 'urgent' ? 'bg-red-100' :
                  activity.status === 'resolved' ? 'bg-green-100' :
                  activity.status === 'pending' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {activity.type === 'report' && <FileText className="w-5 h-5 text-yellow-600" />}
                  {activity.type === 'emergency' && <Bell className="w-5 h-5 text-red-600" />}
                  {activity.type === 'resolved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {activity.type === 'user' && <Users className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{activity.desc}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Report Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-semibold">45</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-semibold">67</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Resolved</span>
                  <span className="text-sm font-semibold">88</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm py-3 px-4 rounded-lg text-sm font-semibold transition text-left">
                📢 Create Announcement
              </button>
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm py-3 px-4 rounded-lg text-sm font-semibold transition text-left">
                👥 Add New User
              </button>
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm py-3 px-4 rounded-lg text-sm font-semibold transition text-left">
                📊 Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Pending Reports</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Title</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Location</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Priority</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {report.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800">{report.title}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{report.location}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{report.date}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      report.priority === 'high' ? 'bg-red-100 text-red-800' :
                      report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
