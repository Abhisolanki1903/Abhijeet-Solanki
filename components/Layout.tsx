import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Beaker, 
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = (path: string) => 
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      location.pathname === path 
        ? 'bg-indigo-50 text-indigo-700 font-medium' 
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Beaker className="w-6 h-6 text-indigo-600 mr-2" />
          <span className="text-xl font-bold text-slate-800">AquaLIMS</span>
        </div>

        <nav className="p-4 space-y-1">
          <Link to="/" className={navClass('/')}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Data Entry & Logs</span>
          </Link>

          {user?.role === UserRole.ADMIN && (
            <Link to="/users" className={navClass('/users')}>
              <Users className="w-5 h-5" />
              <span>User Management</span>
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-slate-50">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-slate-900">{user?.username}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase()}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
          <div className="flex items-center font-bold text-slate-800">
            <Beaker className="w-6 h-6 text-indigo-600 mr-2" />
            AquaLIMS
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};