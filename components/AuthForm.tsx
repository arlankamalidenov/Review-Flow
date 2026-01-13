import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Server, User } from 'lucide-react';
import { Input, Button } from './ui/Primitives';
import { WPCredentials } from '../types';

interface AuthFormProps {
  onLogin: (creds: WPCredentials) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate a brief validation delay for UX
    setTimeout(() => {
      onLogin({ url, username, appPassword });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-xl border border-white/20 shadow-glass rounded-3xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <Server className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ReviewFlow</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your WordPress comments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
                <Input 
                  placeholder="https://your-site.com" 
                  label="WordPress URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
            </div>
            
            <div className="relative">
                <Input 
                  placeholder="Username" 
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
            </div>

            <div className="relative">
                <Input 
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx" 
                  label="Application Password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5 px-1">
                  Generate this in WP Admin &rarr; Users &rarr; Profile.
                </p>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" size="lg" isLoading={loading}>
            Connect Dashboard
          </Button>
        </form>
      </motion.div>
    </div>
  );
};