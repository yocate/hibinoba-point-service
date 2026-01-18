import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, Coins, Activity } from 'lucide-react';

interface DailyStat {
    date: string;
    count: number;
    volume: number;
}

interface RecentTx {
    id: string;
    sender_name: string;
    receiver_name: string;
    amount: number;
    description: string;
    created_at: string;
}

interface SystemStats {
    total_users: number;
    active_users: number;
    total_points: number;
    daily_transactions: DailyStat[];
    recent_transactions?: RecentTx[];
    ai_summary?: string;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center text-gray-500">Loading dashboard...</div>;
    if (!stats) return <div className="p-8 text-red-500">Failed to load stats. Please refresh.</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Executive Dashboard</h1>
                <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>

            {/* AI Summary Card - Prompted by User */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 relative z-10 w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                AI INSIGHTS
                            </span>
                            <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Weekly Analysis</span>
                        </div>
                        <p className="text-gray-700 text-lg leading-relaxed font-medium">
                            {stats.ai_summary || "Analyzing data..."}
                        </p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-white/40 to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <Users size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Users</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active_users} <span className="text-sm font-normal text-gray-400">/ {stats.total_users}</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
                    <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
                        <Coins size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Points</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_points.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                        <Activity size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Transactions (7d)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.daily_transactions?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Col: Charts (8 cols) */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-gray-400" />
                            Transaction Volume Trend
                        </h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.daily_transactions || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value: number) => value.toLocaleString()}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [value?.toLocaleString() || '0', 'Points']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f3f4f6' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="volume" fill="#6366f1" name="Points" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Col: Recent Transactions (4 cols) */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Coins size={18} className="text-gray-400" />
                            Recent Transactions
                        </h2>
                        <div className="space-y-4">
                            {stats.recent_transactions?.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg">
                                            {/* Avatar Placeholder based on name */}
                                            {tx.sender_name === 'System' ? '🤖' : '👤'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {tx.sender_name} <span className="text-gray-400">→</span> {tx.receiver_name}
                                            </div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{tx.description || "No description"}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-indigo-600">+{tx.amount.toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-400">{tx.created_at}</div>
                                    </div>
                                </div>
                            ))}
                            {(!stats.recent_transactions || stats.recent_transactions.length === 0) && (
                                <div className="text-center text-gray-400 py-8">No recent transactions</div>
                            )}
                        </div>
                        <button className="w-full mt-6 py-2 text-sm text-center text-indigo-600 font-medium hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                            View All Transactions
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
