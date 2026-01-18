import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { ReasonApi, type TransactionReason } from '../lib/api';

export default function Settings() {
    const [reasons, setReasons] = useState<TransactionReason[]>([]);
    const [newReason, setNewReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReasons();
    }, []);

    const fetchReasons = async () => {
        try {
            const data = await ReasonApi.getAll();
            setReasons(data);
        } catch (error) {
            console.error('Failed to fetch reasons', error);
        }
    };

    const handleAddReason = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReason.trim()) return;

        setLoading(true);
        try {
            await ReasonApi.create(newReason);
            setNewReason('');
            fetchReasons();
        } catch (error) {
            console.error('Failed to create reason', error);
            alert('Failed to add reason');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReason = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reason?')) return;

        try {
            await ReasonApi.delete(id);
            fetchReasons();
        } catch (error) {
            console.error('Failed to delete reason', error);
            alert('Failed to delete reason');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
                    <p className="text-stone-500">Manage system configurations</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Transaction Reasons (Gratitude)</h2>
                <p className="text-sm text-stone-500 mb-6">
                    Manage the reasons available when granting points. These appear as options for staff.
                </p>

                {/* Add New Reason Form */}
                <form onSubmit={handleAddReason} className="flex gap-3 mb-8">
                    <input
                        type="text"
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        placeholder="Enter new reason (e.g. Rehabilitation)"
                        className="flex-1 px-4 py-2 bg-stone-50 border-none rounded-lg focus:ring-2 focus:ring-amber-500/20 text-stone-900"
                    />
                    <button
                        type="submit"
                        disabled={loading || !newReason.trim()}
                        className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Reason
                    </button>
                </form>

                {/* Reasons List */}
                <div className="space-y-3">
                    {reasons.map((reason) => (
                        <div
                            key={reason.id}
                            className="flex items-center justify-between p-4 bg-stone-50 rounded-xl group"
                        >
                            <span className="font-medium text-stone-700">{reason.name}</span>
                            <button
                                onClick={() => handleDeleteReason(reason.id)}
                                className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete reason"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {reasons.length === 0 && (
                        <div className="text-center py-8 text-stone-400">
                            No reasons defined yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
