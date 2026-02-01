
import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { Clock, Tag, Star, ShieldCheck, Play, X } from 'lucide-react';

interface Props {
  service: Service;
  lang: Language;
  onBook: () => void;
  displayRate?: string;
}

const ProductDetails: React.FC<Props> = ({ service, lang, onBook, displayRate }) => {
  const t = translations[lang];
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video when modal opens
  useEffect(() => {
    if (showVideoModal && videoRef.current) {
      videoRef.current.play();
    }
  }, [showVideoModal]);

  // Pause video when modal closes
  const handleCloseModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideoModal(false);
  };

  // Check if service has a video
  const hasVideo = service.videoUrl && service.videoUrl.trim().length > 0;

  return (
    <div className="pb-24 animate-in slide-in-from-right-8 duration-300">
      {/* Service Media Header - Clickable Image/Video Thumbnail */}
      <div 
        onClick={() => hasVideo && setShowVideoModal(true)}
        className={`h-[40vh] w-full bg-slate-100 relative overflow-hidden group ${
          hasVideo ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {/* Display thumbnail or video preview */}
        {service.thumbnail ? (
          <img 
            src={service.thumbnail} 
            alt={service.name[lang]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : service.videoUrl ? (
          <video 
            src={service.videoUrl} 
            className="w-full h-full object-cover" 
            muted 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <span className="text-slate-400 font-bold">No Image</span>
          </div>
        )}
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Play Icon Overlay - Only visible if video exists */}
        {hasVideo && (
          <>
            {/* Outer circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center group-hover:bg-white/50 group-hover:scale-110 transition-all duration-300">
                <Play size={40} className="text-white fill-white ml-1" />
              </div>
            </div>
            {/* Subtle text */}
            <div className="absolute bottom-6 left-6 text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Tap to watch video
            </div>
          </>
        )}
      </div>

      {/* Video Modal/Popup */}
      {showVideoModal && hasVideo && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-2xl bg-black rounded-[30px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-50 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all active:scale-90"
              title="Close video"
            >
              <X size={28} />
            </button>

            {/* Video Player */}
            <div className="relative bg-black w-full aspect-video">
              <video
                ref={videoRef}
                src={service.videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted={false}
                controls
                controlsList="nodownload"
              />
            </div>

            {/* Video Info */}
            <div className="p-6 bg-slate-900 text-white space-y-2">
              <h3 className="text-lg font-black text-white">{service.name[lang]}</h3>
              <p className="text-sm text-slate-300">{service.features[lang]}</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-[20px] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseModal();
                    onBook();
                  }}
                  className="flex-1 py-3 bg-[#FFB7C5] hover:bg-[#FFB7C5]/90 text-white font-bold rounded-[20px] transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8 -mt-8 relative z-10 bg-white rounded-t-[40px] border-t-4 border-[#FFB7C5]/30">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800">{service.name[lang]}</h2>
            <div className="flex items-center gap-2 text-pink-400 font-bold">
              <Star size={16} fill="currentColor" />
              <span>4.9 (120+ Reviews)</span>
            </div>
          </div>
          <div className="bg-[#FFF9C4] px-4 py-2 rounded-[20px] font-black text-yellow-800 border-2 border-yellow-200">
            {displayRate || service.rate}
          </div>
        </div>

        {/* Cute Data Table */}
        <div className="overflow-hidden rounded-[30px] border-2 border-[#E0F2F1] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E0F2F1] text-teal-800 uppercase text-[11px] font-black tracking-widest">
                <th className="px-6 py-4">{t.name}</th>
                <th className="px-6 py-4">{t.features}</th>
                <th className="px-6 py-4">{t.time}</th>
                <th className="px-6 py-4">{t.profit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50">
              <tr className="hover:bg-teal-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700">{service.name[lang]}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[150px]">{service.features[lang]}</td>
                <td className="px-6 py-4 text-sm font-black text-teal-600">{service.time}</td>
                <td className="px-6 py-4 font-black text-pink-500">{service.rate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Service Description Section */}
        {service.features && service.features[lang] && (
          <div className="p-4 bg-pink-50 border-2 border-pink-100 rounded-[20px]">
            <h3 className="text-sm font-black text-slate-800 mb-2">{t.features || 'Service Details'}</h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">{service.features[lang]}</p>
          </div>
        )}

        {/* Perks */}
        <div className="grid grid-cols-2 gap-4">
          <Perk icon={<ShieldCheck className="text-teal-500" />} label="Verified Pros" />
          <Perk icon={<Clock className="text-pink-500" />} label="Quick Service" />
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-24 left-6 right-6 z-50">
          <button 
            onClick={onBook}
            className="w-full py-5 bg-[#FFB7C5] text-white font-black text-xl rounded-[30px] shadow-[0_10px_30px_rgba(255,183,197,0.4)] active:scale-[0.98] active:shadow-lg transition-all"
          >
            {t.bookNow}
          </button>
        </div>
      </div>
    </div>
  );
};

const Perk: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[30px] border border-slate-100">
    {icon}
    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
  </div>
);

export default ProductDetails;
