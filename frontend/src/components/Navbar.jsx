import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
    const parts = nameOrEmail.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameOrEmail.slice(0, 2).toUpperCase();
  };

  const displayName = user?.username || user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="sticky top-0 z-40 w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-600/25 group-hover:shadow-purple-600/40 transition-all duration-300">
              <Brain className="w-5 h-5 text-white transform group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                OmniMind<span className="text-purple-400 ml-1">AI</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-gray-400 -mt-1 hidden sm:block">
                Multimodal Intelligence
              </span>
            </div>
          </Link>

          {/* User Controls */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Dashboard</span>
              </Link>

              <div className="h-5 w-px bg-gray-800 hidden sm:block" />

              {/* User profile & avatar */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-700 to-violet-500 border border-purple-400/30 flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                  title={displayName}
                >
                  {getInitials(displayName)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-200 leading-none">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-400 leading-none mt-1 truncate max-w-[140px]">
                    {user?.email || ''}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
