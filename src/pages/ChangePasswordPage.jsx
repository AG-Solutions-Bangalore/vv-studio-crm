import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { changeUserPassword } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const { user } = useAuthContext();
  
  const [username, setUsername] = useState(user?.username || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !oldPassword.trim() || !newPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await changeUserPassword({
        username: username.trim(),
        old_password: oldPassword.trim(),
        new_password: newPassword.trim(),
      });

      const msg = response?.message || 'Password changed successfully.';
      setMessage(msg);
      toast.success(msg);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const msg = err.message || 'Unable to change password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Change Password" />

        <main className="flex-1 p-8 max-w-2xl w-full">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security & Credentials</h3>
                <p className="text-xs text-slate-500">Update your administrator account password</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:bg-slate-400"
                >
                  {isSubmitting ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
