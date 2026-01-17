import React from 'react';
import { LogOut, Coins } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Top Navigation Header */}
            <header className="bg-stone-900 border-b border-stone-800 text-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-500 to-violet-600 p-2 rounded-lg shadow-lg shadow-orange-900/20">
                                <Coins size={20} className="text-white" strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Point System Admin</span>
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
