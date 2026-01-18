import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/users');
        } catch (err: any) {
            console.error(err);
            setError('Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border border-stone-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
                        <LayoutDashboard className="w-8 h-8 text-orange-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900">Admin Portal</h1>
                    <p className="text-stone-500 mt-2">Sign in to manage the system</p>
                </div>

                {error && ( // Kept error display as it's handled by state
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-stone-900 transition-all"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-stone-900 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading} // Kept disabled state for loading
                        className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all transform hover:scale-[1.02] shadow-lg shadow-stone-200 flex justify-center items-center gap-2 disabled:opacity-70" // Added flex, justify-center, items-center, gap-2, disabled:opacity-70 for Loader2
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                    </button>

                    <div className="text-center text-xs text-stone-400 mt-4">
                        ひびのば ポイント v1.0
                    </div>
                </form>
            </div>
        </div>
    );
}
