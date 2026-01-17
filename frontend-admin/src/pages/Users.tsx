import { useEffect, useState } from 'react';
import { UserApi, TransactionApi } from '../lib/api';
import type { User } from '../types';
import { Plus, Edit2, Trash2, CheckCircle, Search, Coins, Ban } from 'lucide-react';
import UserModal from '../components/UserModal';
import GrantPointsModal from '../components/GrantPointsModal';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

    // Selection
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [grantUser, setGrantUser] = useState<User | null>(null);

    const [search, setSearch] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);

    const fetchUsers = async () => {
        try {
            const data = await UserApi.getAll();
            setUsers(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Create / Edit User Handlers
    const handleCreate = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    // Grant Points Handlers
    const handleOpenGrant = (user: User) => {
        setGrantUser(user);
        setIsGrantModalOpen(true);
    };

    const handleGrantPoints = async (userId: string, amount: number) => {
        await TransactionApi.issue(userId, amount, currentUser?.id);
        alert(`Successfully granted ${amount} points`);
        fetchUsers(); // Refresh to show new balance
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to DELETE ${user.name}? This will deactivate their account.`)) return;
        try {
            console.log("Deleting user:", user.id);
            await UserApi.delete(user.id);
            // Wait a bit or ensure fetchUsers busts cache?
            setTimeout(fetchUsers, 100);
        } catch (error) {
            console.error("Delete failed", error);
            alert('Failed to delete user');
        }
    };

    const handleSubmitUser = async (data: Partial<User> & { password?: string }) => {
        if (editingUser) {
            await UserApi.update(editingUser.id, data);
        } else {
            await UserApi.create(data);
        }
        fetchUsers();
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesDeleted = showDeleted ? true : u.is_active;
        return matchesSearch && matchesDeleted;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Users</h1>
                    <p className="text-slate-500">Manage system users and access</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center px-4 border-l border-slate-200">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            Show Deleted
                        </label>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{user.name}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                                                    <CheckCircle size={14} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-400 text-sm font-medium">
                                                    <Ban size={14} /> Disabled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                            {user.balance.toLocaleString()} pts
                                        </td>
                                        <td className="px-6 py-4 flex justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenGrant(user)}
                                                className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                title="Grant Points"
                                            >
                                                <Coins size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {user.is_active && (
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSubmit={handleSubmitUser}
                user={editingUser}
            />

            <GrantPointsModal
                isOpen={isGrantModalOpen}
                onClose={() => setIsGrantModalOpen(false)}
                onSubmit={handleGrantPoints}
                user={grantUser}
            />
        </div>
    );
}
