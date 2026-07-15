import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OTPVerificationProps {
  email?: string;
  onVerified?: () => void;
}

export default function OTPVerification({ email, onVerified }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      setLoading(false);
      return;
    }

    if (!email) {
      setError('Email is required for verification');
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpString,
      type: 'email',
    });

    if (verifyError) {
      setError(verifyError.message || 'Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    if (onVerified) {
      onVerified();
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError('Email is required to resend OTP');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (resendError) {
        setError(resendError.message || 'Failed to resend OTP. Please try again.');
      } else {
        setResendSuccess(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
        <p className="text-gray-400">Your account has been verified.</p>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/30 via-transparent to-purple-950/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg opacity-80" />
              <Shield className="relative z-10 w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold font-sora bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Grow with Us
            </span>
          </Link>
          <p className="text-gray-400">Enter the verification code sent to</p>
          <p className="text-white font-medium">{email || 'your email'}</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* OTP Input */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl font-semibold focus:outline-none focus:border-blue-500 transition-colors duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some((d) => !d)}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {resendSuccess ? (
              <p className="text-green-400 text-sm">New verification code sent!</p>
            ) : (
              <p className="text-gray-400 text-sm">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link to="/auth/login" className="text-sm text-gray-500 hover:text-white transition-colors">
            ← Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
