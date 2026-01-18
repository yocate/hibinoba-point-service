import { LogOut, Coins, Users as UsersIcon, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Top Navigation Header */}
            <header className="bg-stone-900 border-b border-stone-800 text-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-orange-500 to-violet-600 p-2 rounded-lg shadow-lg shadow-orange-900/20">
                                    <Coins size={20} className="text-white" strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-lg tracking-tight">ひびのば ポイント 管理画面</span>
                            </div>

                            {/* Nav Links */}
                            <nav className="flex items-center gap-1">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/dashboard'
                                        ? 'bg-stone-800 text-white'
                                        : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                        }`}
                                >
                                    <LayoutDashboard size={16} />
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/users')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/users'
                                        ? 'bg-stone-800 text-white'
                                        : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                        }`}
                                >
                                    <UsersIcon size={16} />
                                    Users
                                </button>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/settings'
                                        ? 'bg-stone-800 text-white'
                                        : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                        }`}
                                >
                                    <SettingsIcon size={16} />
                                    Settings
                                </button>
                            </nav>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-px bg-stone-700/50 hidden md:block"></div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 group hover:text-rose-400 transition-colors"
                            >
                                <span className="text-sm font-medium text-stone-300 group-hover:text-rose-300">Sign Out</span>
                                <LogOut size={18} className="text-stone-400 group-hover:text-rose-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
