import { Outlet, Link, useLocation } from 'react-router-dom';
import { Video, LayoutDashboard, FolderOpen, History, Settings, Plus, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', icon: Video, label: 'Tạo Video' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/templates', icon: FolderOpen, label: 'Templates' },
  { path: '/projects', icon: FolderOpen, label: 'Projects' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm leading-tight">AI Video</h1>
              <p className="text-xs text-gray-500">Generator</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === path
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
            <Link
              to="/avatar/create"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo Avatar
            </Link>
            <Link
              to="/avatar/library"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Avatar Library
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-xs font-medium text-primary-700">Powered by</p>
            <p className="text-xs text-primary-600 mt-0.5">nano-banana + Kling + Sora + Veo</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
