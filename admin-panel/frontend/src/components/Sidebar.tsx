import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { admin } = useAuthStore();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      show: admin?.permissions.canViewDashboard
    },
    {
      name: 'Whitelists',
      href: '/whitelists',
      icon: ClipboardDocumentListIcon,
      show: admin?.permissions.canViewWhitelists
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: DocumentTextIcon,
      show: admin?.permissions.canViewTemplates
    },
    {
      name: 'Admins',
      href: '/admins',
      icon: UsersIcon,
      show: admin?.permissions.canViewAdmins
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      show: admin?.permissions.canViewAnalytics
    },
    {
      name: 'Paramètres',
      href: '/settings',
      icon: Cog6ToothIcon,
      show: true
    }
  ].filter(item => item.show);

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 glass border-r border-white/10 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            FiveM Panel
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
              {admin?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {admin?.username}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {admin?.isMasterAdmin ? 'Master Admin' : 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
