
import React from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { Clock, Tag, Star, ShieldCheck } from 'lucide-react';

interface Props {
  service: Service;
  lang: Language;
  onBook: () => void;
  displayRate?: string;
}

const ProductDetails: React.FC<Props> = ({ service, lang, onBook, displayRate }) => {
  const t = translations[lang];

  return (
    <div className="pb-24 animate-in slide-in-from-right-8 duration-300">
      {/* Reel Header */}
      <div className="h-[40vh] w-full bg-slate-100 relative overflow-hidden">
        <video 
          src={service.videoUrl} 
          className="w-full h-full object-cover" 
          autoPlay 
          muted 
          loop 
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

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
