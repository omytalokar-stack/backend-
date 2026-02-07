import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, ChevronUp } from 'lucide-react';

interface UpdateAvailableProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateAvailable: React.FC<UpdateAvailableProps> = ({ onUpdate, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    console.log('🔄 Update initiated by user');
    
    try {
      // Post message to waiting service worker
      // If there's a waiting SW, post to it
      const reg = (navigator.serviceWorker as any)?.getRegistration ? await (navigator.serviceWorker as any).getRegistration() : null;
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Wait a tiny bit, then reload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force hard reload (bypass cache)
      console.log('🔄 Force reloading page with fresh cache');
      try {
        // @ts-ignore
        window.location.reload(true);
      } catch (e) {
        window.location.reload();
      }
    } catch (err) {
      console.error('❌ Error during update:', err);
      // Some browsers don't support reload(true) signature; fall back to standard reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Animated Background Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] animate-in fade-in duration-300" />
      
      {/* Update Popup Container */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl animate-in zoom-in-95 scale-95 duration-300 overflow-hidden">
          {/* Gradient Header Bar */}
          <div className="relative h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
          
          {/* Animated Icon at Top */}
          <div className="relative -mt-12 flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl animate-bounce">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <Zap size={32} className="text-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-2 pb-6 text-center space-y-4">
            {/* Heading */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">
                ✨ Update Available!
              </h2>
              <p className="text-slate-600 font-bold">
                We've got new features and improvements for you
              </p>
            </div>

            {/* Features Highlight */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[20px] p-4 border-2 border-purple-100 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="text-lg">⚡</span> Faster Performance
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="text-lg">🎨</span> Better Design
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="text-lg">🐛</span> Bug Fixes
              </div>
            </div>

            {/* Info Text */}
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <p className="text-xs font-bold text-blue-700 text-left">
                💾 Your data is safe. We'll reload the app with the latest version.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Update Button */}
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-black text-lg rounded-[25px] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ChevronUp size={20} />
                    Update Now
                  </>
                )}
              </button>

              {/* Dismiss Button */}
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[25px] transition-all active:scale-95 disabled:opacity-50"
              >
                Maybe Later
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              This update will be applied automatically after 24 hours
            </p>
          </div>

          {/* Footer Accent */}
          <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400" />
        </div>
      </div>
    </>
  );
};

export default UpdateAvailable;
