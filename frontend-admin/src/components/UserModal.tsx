import { useState, useEffect } from 'react';
import type { User } from '../types';
import { X } from 'lucide-react';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<User> & { password?: string }) => Promise<void>;
    user?: User | null;
}

export default function UserModal({ isOpen, onClose, onSubmit, user }: UserModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        password: '',
        is_active: true,
        avatar_data: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                password: '',
                is_active: user.is_active,
                avatar_data: user.avatar_data || '',
            });
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'user',
                password: '',
                is_active: true,
                avatar_data: '',
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Strip data:image/...;base64, prefix for backend
                const base64Data = result.split(',')[1];
                setFormData(prev => ({ ...prev, avatar_data: base64Data }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-stone-900 mb-6">
                    {user ? 'Edit User' : 'New User'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-24 h-24 rounded-full bg-stone-100 mb-3 overflow-hidden border-2 border-stone-200">
                            {formData.avatar_data ? (
                                <img
                                    src={`data:image/jpeg;base64,${formData.avatar_data}`}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400 text-3xl font-bold">
                                    {(formData.name || 'U').charAt(0)}
                                </div>
                            )}
                        </div>
                        <label className="cursor-pointer px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium transition-colors">
                            プロフィール写真の編集
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-orange-500/20 text-stone-900"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-orange-500/20 text-stone-900"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-orange-500/20 text-stone-900"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-orange-500/20 text-stone-900"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-stone-700">Active Account</span>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${formData.is_active ? 'bg-orange-600' : 'bg-stone-200'
                                }`}
                        >
                            <span
                                className={`${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (user ? 'Save Changes' : 'Create User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
