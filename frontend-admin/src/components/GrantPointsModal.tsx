import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import type { User } from '../types';

interface GrantPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: string, amount: number) => Promise<void>;
    user: User | null;
}

export default function GrantPointsModal({ isOpen, onClose, onSubmit, user }: GrantPointsModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseInt(amount, 10);
        if (isNaN(value) || value <= 0) {
            alert('Please enter a valid positive amount');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(user.id, value);
            setAmount('');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to grant points');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Coins className="text-yellow-500" />
                        Grant Points
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-stone-500 mb-1">Recipient</p>
                    <div className="font-medium text-stone-900">{user.name}</div>
                    <div className="text-xs text-stone-500">{user.email}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Amount (Points)
                        </label>
                        <div className="relative">
                            <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                            <input
                                type="number"
                                required
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-amber-500/20 text-stone-900 font-medium"
                                placeholder="0"
                            />
                        </div>
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
                            className="flex-1 px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-xl font-medium transition-colors shadow-lg shadow-amber-200"
                        >
                            {loading ? 'Granting...' : 'Grant Points'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
