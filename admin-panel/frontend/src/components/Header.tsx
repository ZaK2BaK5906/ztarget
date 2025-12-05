import { useAuthStore } from '@/stores/authStore';
import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { logout, admin } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/10 backdrop-blur-xl">
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-white">
            Bienvenue, {admin?.username}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
