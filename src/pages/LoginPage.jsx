import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const { companyInfo, companyLogoUrl } = useAppContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleMobileChange = (e) => {
    const rawValue = e.target.value;

    if (/\D/.test(rawValue)) {
      toast.error('Only numbers are allowed in mobile number.', { id: 'mobile-chars' });
    }

    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length > 10) {
      toast.error('Mobile number cannot exceed 10 digits.', { id: 'mobile-max' });
    }

    const numericValue = digitsOnly.slice(0, 10);
    setUsername(numericValue);
    if (error) setError('');
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: '' }));
    }
  };

  const handleMobileKeyDown = (e) => {
    if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !/^\d$/.test(e.key)
    ) {
      toast.error('Only numbers are allowed in mobile number.', { id: 'mobile-chars' });
    } else if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      /^\d$/.test(e.key) &&
      username.length >= 10 &&
      window.getSelection()?.toString() === ''
    ) {
      toast.error('Mobile number cannot exceed 10 digits.', { id: 'mobile-max' });
    }
  };

  const handleMobileBlur = () => {
    if (username && username.length < 10) {
      toast.error('Mobile number must be exactly 10 digits.', { id: 'mobile-min' });
      setFieldErrors((prev) => ({ ...prev, username: 'Mobile number must be exactly 10 digits.' }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    const cleanPhone = username.trim();

    if (!cleanPhone) {
      errors.username = 'Please enter mobile number.';
      toast.error('Please enter mobile number.', { id: 'login-phone-req' });
    } else if (cleanPhone.length !== 10) {
      errors.username = 'Mobile number must be exactly 10 digits.';
      toast.error('Mobile number must be exactly 10 digits.', { id: 'login-phone-len' });
    }

    if (!password.trim()) {
      errors.password = 'Please enter password.';
      if (cleanPhone && cleanPhone.length === 10) {
        toast.error('Please enter password.', { id: 'login-pwd-req' });
      }
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      const firstError = errors.username || errors.password;
      setError(firstError);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser({
        username: username.trim(),
        password: password.trim(),
      });

      await login(response);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 py-12 select-none text-[#1A1817]">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E3DA] bg-white p-8 sm:p-10 shadow-[0_8px_30px_-6px_rgba(30,25,20,0.06)]">
        
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src={companyLogoUrl || '/no_image.jpg'}
              alt={companyInfo?.company_name || 'Logo'}
              className="h-14 w-auto max-w-[200px] object-contain"
              onError={(e) => {
                if (e.currentTarget.src !== window.location.origin + '/no_image.jpg') {
                  e.currentTarget.src = '/no_image.jpg';
                }
              }}
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1A1817] tracking-tight">
            {companyInfo?.company_name || 'Admin Portal'}
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            {companyInfo?.company_short ? `${companyInfo.company_short} • ` : ''}Admin Access Portal
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-[#FDF0F0] p-3 text-xs text-[#9A2D2D] border border-[#F6C8C8]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">Mobile Number</label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488] pointer-events-none" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={username}
                onChange={handleMobileChange}
                onKeyDown={handleMobileKeyDown}
                onBlur={handleMobileBlur}
                placeholder="Enter 10-digit mobile number"
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border ${
                  fieldErrors.username ? 'border-[#E05252] bg-[#FFF8F8]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs`}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-[11px] text-[#E05252] mt-1 pl-1 font-medium">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#3D372E]">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#8C6527] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C9488] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                  fieldErrors.password ? 'border-[#E05252] bg-[#FFF8F8]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9C9488] hover:text-[#1A1817] p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-[#E05252] mt-1 pl-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-sm font-semibold shadow-xs transition-all active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

