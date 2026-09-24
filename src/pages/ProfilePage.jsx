import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import LogoutConfirmModal from '../components/common/LogoutConfirmModal';
import { fetchProfile, updateProfile, changeUserPassword } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { 
  Phone, 
  Mail, 
  Save, 
  Lock, 
  LogOut, 
  Eye, 
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { companyInfo, companyLogoUrl } = useAppContext();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Edit Profile Form
  const [form, setForm] = useState({ mobile: '', email: '' });

  // Change Password Form
  const [passForm, setPassForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  /* ── 1. FETCH PROFILE (GET /panel-fetch-profile) ── */
  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchProfile();
      const data = res?.data || res?.profile || res?.user || res || {};
      setProfile(data);
      setForm({
        mobile: data?.mobile || data?.phone || data?.company_mobile_no || '',
        email: data?.email || data?.company_email || '',
      });
    } catch (err) {
      console.warn('[Profile] fetchProfile note:', err.message);
      setForm({
        mobile: user?.mobile || '',
        email: user?.email || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── 2. UPDATE PROFILE (PUT /panel-update-profile) ── */
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const mobileVal = (form.mobile || '').trim();
    const emailVal = (form.email || '').trim();

    if (!mobileVal) {
      toast.error('Please enter a mobile number.');
      return;
    }

    if (!emailVal || !emailVal.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({ mobile: mobileVal, email: emailVal });
      const msg = res?.message || 'Profile updated successfully.';
      toast.success(msg);
      await loadProfile();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to update profile.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── 3. CHANGE PASSWORD (POST /panel-change-password) ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passForm.old_password || !passForm.new_password) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (passForm.new_password !== passForm.confirm_password) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setChangingPass(true);
    try {
      const username = profile?.username || user?.username || 'admin';
      const res = await changeUserPassword({
        username,
        old_password: passForm.old_password,
        new_password: passForm.new_password,
      });

      const msg = res?.message || 'Password changed successfully.';
      toast.success(msg);
      setPassForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to change password.';
      toast.error(msg);
    } finally {
      setChangingPass(false);
    }
  };

  /* ── 4. LOGOUT (POST /panel-logout) ── */
  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch (err) {
      toast.error('Logout completed.');
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0] text-[#1A1817]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="User Profile" />

        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-[#E8E3DA] bg-white p-12 shadow-xs">
              <div className="flex flex-col items-center gap-3 text-[#7A7369]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1A1817] border-t-transparent" />
                <p className="text-xs font-semibold">Loading profile details...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Profile Card & Quick Actions */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#E8E3DA] bg-white p-6 shadow-[0_4px_20px_-4px_rgba(30,25,20,0.05)] text-center">
                  <div className="relative mb-4 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#1A1817] text-[#FAF8F5] text-2xl font-serif font-bold shadow-xs">
                    {profile?.name
                      ? profile.name.slice(0, 2).toUpperCase()
                      : user?.username?.slice(0, 2)?.toUpperCase() || 'AD'}
                  </div>

                  <h2 className="font-serif text-lg font-semibold text-[#1A1817] tracking-tight">
                    {profile?.name || user?.name || profile?.username || 'Administrator'}
                  </h2>
                  <p className="text-xs text-[#8C8275] mt-0.5">
                    {profile?.role || 'Administrator'}
                  </p>

                  <div className="mt-6 w-full border-t border-[#F0ECE3] pt-5 text-left space-y-3.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C9488]">Username</span>
                      <p className="text-xs font-semibold text-[#1A1817] mt-0.5">{profile?.username || user?.username || 'admin'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C9488]">Current Mobile</span>
                      <p className="text-xs font-semibold text-[#1A1817] mt-0.5">{profile?.mobile || form.mobile || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C9488]">Current Email</span>
                      <p className="text-xs font-semibold text-[#1A1817] mt-0.5">{profile?.email || form.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Logout Action Button */}
                  <div className="mt-6 pt-5 border-t border-[#F0ECE3]">
                    <button
                      type="button"
                      onClick={() => setLogoutModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#F6C8C8] bg-[#FDF0F0] hover:bg-[#FBE4E4] text-[#9A2D2D] text-xs font-semibold transition active:scale-95 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>

                {/* Company Context */}
                {companyInfo && (
                  <div className="rounded-2xl border border-[#E8E3DA] bg-white p-5 text-left space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-3 border-b border-[#F0ECE3] pb-3">
                      {companyLogoUrl && (
                        <img src={companyLogoUrl} alt="Logo" className="h-7 w-auto object-contain" />
                      )}
                      <div>
                        <h3 className="font-serif text-sm font-semibold text-[#1A1817]">{companyInfo.company_name}</h3>
                        {companyInfo.company_place && (
                          <p className="text-[10px] text-[#8C8275]">{companyInfo.company_place}</p>
                        )}
                      </div>
                    </div>
                    {companyInfo.company_address && (
                      <div className="pt-1 text-[11px] text-[#4A443D]">
                        <span className="text-[10px] text-[#9C9488] font-bold block uppercase tracking-wider mb-0.5">Office Location</span>
                        {companyInfo.company_address}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Edit Profile + Change Password */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Edit Profile Form */}
                <div className="rounded-2xl border border-[#E8E3DA] bg-white shadow-[0_4px_20px_-4px_rgba(30,25,20,0.05)] overflow-hidden">
                  <div className="border-b border-[#F0ECE3] px-6 py-4 bg-[#FAF8F5]">
                    <h2 className="font-serif text-base font-semibold text-[#1A1817] tracking-tight">Edit Profile Information</h2>
                    <p className="text-xs text-[#7A7369]">Update your mobile number and email address</p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
                        <input
                          type="text"
                          name="mobile"
                          value={form.mobile}
                          onChange={handleChange}
                          placeholder="Enter mobile number"
                          required
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          required
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#F0ECE3]">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5 text-[#F5CE93]" />
                        <span>{saving ? 'Saving...' : 'Update Profile'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Change Password Form */}
                <div className="rounded-2xl border border-[#E8E3DA] bg-white shadow-[0_4px_20px_-4px_rgba(30,25,20,0.05)] overflow-hidden">
                  <div className="border-b border-[#F0ECE3] px-6 py-4 bg-[#FAF8F5]">
                    <h2 className="font-serif text-base font-semibold text-[#1A1817] tracking-tight">Change Password</h2>
                    <p className="text-xs text-[#7A7369]">Update your account password securely</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
                        <input
                          type={showOldPass ? 'text' : 'password'}
                          name="old_password"
                          value={passForm.old_password}
                          onChange={handlePassChange}
                          placeholder="Enter current password"
                          required
                          className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPass(!showOldPass)}
                          className="absolute right-3.5 top-2.5 text-[#9C9488] hover:text-[#1A1817]"
                        >
                          {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          name="new_password"
                          value={passForm.new_password}
                          onChange={handlePassChange}
                          placeholder="Enter new password"
                          required
                          className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3.5 top-2.5 text-[#9C9488] hover:text-[#1A1817]"
                        >
                          {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          name="confirm_password"
                          value={passForm.confirm_password}
                          onChange={handlePassChange}
                          placeholder="Confirm new password"
                          required
                          className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3.5 top-2.5 text-[#9C9488] hover:text-[#1A1817]"
                        >
                          {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#F0ECE3]">
                      <button
                        type="submit"
                        disabled={changingPass}
                        className="py-2.5 px-5 rounded-full bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
                      >
                        {changingPass ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        submitting={loggingOut}
      />
    </div>
  );
}

