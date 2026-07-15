import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-6">
          <Construction className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold font-sora text-white mb-2">{title}</h1>
        <p className="text-gray-400">This page is coming soon. Stay tuned!</p>
      </motion.div>
    </div>
  );
}
