import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, User, Mail, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setShowCamera(false);
      alert("Could not access camera.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setPhotoURL(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({ displayName, photoURL });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative premium-card p-8 w-full max-w-md shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-8 tracking-tight">Edit Profile</h2>

            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <User size={56} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={startCamera}
                  className="absolute bottom-0 right-0 p-3 bg-brand-green text-white rounded-full shadow-lg hover:bg-brand-green-light transition-all border-4 border-white dark:border-slate-900"
                >
                  <Camera size={18} />
                </button>
              </div>
              <p className="text-xs font-display font-bold text-slate-500 dark:text-slate-400 uppercase mt-4 tracking-widest">Identity Image</p>
            </div>

            {showCamera && (
              <div className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4">
                <video ref={videoRef} autoPlay playsInline className="max-w-full rounded-[2rem] shadow-2xl mb-12 border-4 border-white/10" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-6">
                  <button 
                    onClick={stopCamera}
                    className="px-8 py-4 bg-white/10 text-white rounded-2xl font-display font-bold hover:bg-white/20 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="glow-button px-12 py-4"
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 transition-all text-sm font-bold text-slate-800 dark:text-white"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 text-sm cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="glow-button w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50 mt-4"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Synchronizing...' : 'Save Changes'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
