import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { User, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { companyInfo, companyLogoUrl } = useAppContext();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
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
    if (message) setMessage('');
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

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (message) setMessage('');
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handleEmailBlur = () => {
    const cleanEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email address.', { id: 'email-inv' });
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
    }
  };

  const validate = () => {
    const errors = {};
    const cleanPhone = username.trim();
    const cleanEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanPhone) {
      errors.username = 'Please enter mobile number.';
      toast.error('Please enter mobile number.', { id: 'fp-phone-req' });
    } else if (cleanPhone.length !== 10) {
      errors.username = 'Mobile number must be exactly 10 digits.';
      toast.error('Mobile number must be exactly 10 digits.', { id: 'fp-phone-len' });
    }

    if (!cleanEmail) {
      errors.email = 'Please enter registered email address.';
      if (cleanPhone && cleanPhone.length === 10) {
        toast.error('Please enter registered email address.', { id: 'fp-email-req' });
      }
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
      if (cleanPhone && cleanPhone.length === 10) {
        toast.error('Please enter a valid email address.', { id: 'fp-email-inv' });
      }
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      const firstError = errors.username || errors.email;
      setError(firstError);
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await sendPasswordResetEmail({
        username: username.trim(),
        email: email.trim(),
      });
      const msg = response?.message || 'Password reset request sent successfully.';
      setMessage(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err.message || 'Unable to send password reset request.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0] px-4 py-12 select-none text-[#1A1817]">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E3DA] bg-white p-8 sm:p-9 shadow-[0_8px_30px_-6px_rgba(30,25,20,0.08)]">
        
        <div className="mb-7 text-center">
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt={companyInfo?.company_name || 'AG Solutions'}
              className="h-12 w-auto mx-auto object-contain mb-3"
            />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-[#1A1817] text-[#FAF8F5] font-serif font-bold mx-auto flex items-center justify-center text-xl mb-3 shadow-xs">
              {companyInfo?.company_short || 'AGS'}
            </div>
          )}
          <h1 className="font-serif text-2xl font-semibold text-[#1A1817] tracking-tight">Forgot Password</h1>
          <p className="text-xs text-[#7A7369] mt-1">
            Enter your details to receive password recovery instructions
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#FDF0F0] p-3 text-xs text-[#9A2D2D] border border-[#F6C8C8]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#EDF7EE] p-3 text-xs text-[#1E6B34] border border-[#C6E6CC]">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">Mobile Number</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
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
                className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border ${
                  fieldErrors.username ? 'border-[#E05252] bg-[#FFF8F8]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs`}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-[11px] text-[#E05252] mt-1 pl-1 font-medium">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D372E] mb-1.5">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C9488]" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="Enter email address..."
                className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border ${
                  fieldErrors.email ? 'border-[#E05252] bg-[#FFF8F8]' : 'border-[#E2DDD5] bg-[#FAF8F5]'
                } text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white transition-all shadow-2xs`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-[#E05252] mt-1 pl-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-full bg-[#1A1817] hover:bg-[#2C2825] text-[#FAF8F5] text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:bg-[#A39C91] cursor-pointer"
          >
            {isSubmitting ? 'Sending Request...' : 'Send Reset Instructions'}
          </button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#7A7369] hover:text-[#1A1817] pt-3 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </form>
      </div>
    </div>
  );
}

