import { useEffect, useState } from 'react';
import { UserApi, TransactionApi } from '../lib/api';
import type { User } from '../types';
import { Plus, Edit2, Trash2, CheckCircle, Search, Coins, Users as UsersIcon } from 'lucide-react';
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

    const [searchQuery, setSearchQuery] = useState('');
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
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
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

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                        <UsersIcon size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">Total Users</div>
                        <div className="text-2xl font-bold text-slate-800">{users.length}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-stone-500">Active Users</div>
                        <div className="text-2xl font-bold text-stone-800">{users.filter(u => u.is_active).length}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-stone-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder-stone-400"
                        />
                    </div>
                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDeleted(!showDeleted)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${showDeleted ? 'bg-orange-600' : 'bg-stone-200'
                                }`}
                        >
                            <span
                                className={`${showDeleted ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                        <span className="text-sm text-stone-600">Show Disabled</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-stone-400 animate-pulse">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-stone-400 flex flex-col items-center gap-2">
                                    <div className="p-4 bg-stone-50 rounded-full"><UsersIcon size={32} /></div>
                                    <p>No users found matching your search.</p>
                                </td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-stone-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mr-3">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-stone-900">{user.name}</div>
                                                    <div className="text-sm text-stone-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-violet-100 text-violet-700'
                                                : 'bg-stone-100 text-stone-700'
                                                }`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-stone-900 font-medium">
                                                <Coins className="w-4 h-4 text-amber-500 mr-2" />
                                                {user.balance.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenGrant(user)}
                                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                                title="Grant Points"
                                            >
                                                <Coins className="w-4 h-4 mr-1.5" />
                                                Grant
                                            </button>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title={user.is_active === false ? "Restore User" : "Deactivate User"}
                                            >
                                                {user.is_active === false ? <CheckCircle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
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
