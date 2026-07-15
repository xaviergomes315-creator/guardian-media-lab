import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Unauthorized() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (profile?.role === 'client') {
      navigate('/portal/dashboard');
    } else if (profile) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black">
        <div className="absolute inset-0 bg-gradient-to-tr from-red-950/20 via-transparent to-orange-950/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="glass-card p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
          >
            <ShieldX className="w-10 h-10 text-red-400" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Access Denied
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mb-2"
          >
            You don't have permission to access this page.
          </motion.p>

          {/* Role info */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500 mb-6"
            >
              <p>Current role: <span className="text-gray-300 capitalize">{profile.role.replace('_', ' ')}</span></p>
              {profile.full_name && (
                <p className="mt-1">Signed in as <span className="text-gray-300">{profile.full_name}</span></p>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out and switch account
            </button>
          </motion.div>

          {/* Help text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-gray-600 mt-6"
          >
            If you believe this is an error, please contact your administrator.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
