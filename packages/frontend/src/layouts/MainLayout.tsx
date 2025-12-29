import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { 
  Users, 
  Search, 
  Mail, 
  UserCircle, 
  Bell, 
  LogOut, 
  Home,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { useNotificationStore } from '../stores/notification.store'
import Avatar from '../components/common/Avatar'

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { to: '/recommend', icon: Sparkles, label: '추천' },
    { to: '/explore', icon: Search, label: '탐색' },
    { to: '/inbox', icon: Mail, label: '받은 요청' },
    { to: '/teams', icon: Users, label: '내 팀' },
    { to: '/my-profile', icon: UserCircle, label: '프로필' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/recommend" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MatchLab</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <NavLink
                to="/notifications"
                className={({ isActive }) => `
                  relative p-2 rounded-lg
                  ${isActive ? 'bg-gray-100' : 'hover:bg-gray-100'}
                `}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>

              <div className="flex items-center gap-2">
                <Avatar name={user?.name || 'User'} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-3 py-2 text-xs
                ${isActive ? 'text-primary-600' : 'text-gray-500'}
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
