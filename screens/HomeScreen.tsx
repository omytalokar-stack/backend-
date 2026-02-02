
import React from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { ShoppingBag, ClipboardList, Gift, Sparkles } from 'lucide-react';

interface Props {
  lang: Language;
  services: Service[];
  onNavigate: (target: 'main' | 'product' | 'my-orders' | 'booking' | 'offers' | 'services') => void;
  onServiceSelect: (service: Service) => void;
  getDisplayRate?: (s: Service) => string;
}

const HomeScreen: React.FC<Props> = ({ lang, services, onNavigate, onServiceSelect, getDisplayRate }) => {
  const t = translations[lang];

  return (
    <div className="w-full max-w-full overflow-hidden p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Offers Shortcut */}
      <div className="p-4 rounded-[30px] border-2 border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-3 bg-pink-100 rounded-[20px] text-pink-500 flex-shrink-0">
            <Gift size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">{t.offers}</p>
            <p className="text-[11px] text-slate-500 font-bold">Claim your 20% OFF</p>
          </div>
        </div>
        <button onClick={() => onNavigate('offers')} className="px-4 py-2 bg-[#FFB7C5] text-white rounded-[20px] font-black active:scale-95 flex-shrink-0 ml-2">
          Claim
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <QuickAction 
          icon={<ShoppingBag size={24} className="text-pink-500" />} 
          label={t.products} 
          bgColor="bg-[#FFB7C5]/20" 
          onClick={() => onNavigate('services')}
        />
        <QuickAction 
          icon={<ClipboardList size={24} className="text-teal-500" />} 
          label={t.myOrders} 
          bgColor="bg-[#E0F2F1]" 
          onClick={() => onNavigate('my-orders')}
        />
        <QuickAction 
          icon={<Gift size={24} className="text-yellow-600" />} 
          label={t.offers} 
          bgColor="bg-[#FFF9C4]" 
          onClick={() => onNavigate('offers')}
        />
      </div>

      {/* Featured Services */}
      <div className="space-y-3 w-full overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 px-1 brand-heading truncate">{t.trendingServices}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {services.map((service, idx) => (
            <div 
              key={`${service._id || service.id}-${idx}`}
              onClick={() => onServiceSelect(service)}
              className="flex-shrink-0 min-w-[140px] w-[140px] group relative bg-white rounded-[20px] border-2 border-slate-50 shadow-md overflow-hidden active:scale-95 transition-all"
            >
              <img
                src={
                  service.imageUrl
                    ? (service.imageUrl.startsWith('http')
                        ? service.imageUrl
                        : `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/${service.imageUrl.replace(/^\/+/, '')}`)
                    : (service.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="128"%3E%3Crect fill="%23f1f5f9" width="160" height="128"/%3E%3C/svg%3E')
                }
                alt={typeof service.name === 'object' ? service.name[lang] : service.name || 'Service'}
                className="w-full h-28 object-cover"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.src = service.thumbnail || '/icons/icon-192.svg';
                }}
              />
              <div className="p-3 space-y-1">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{typeof service.name === 'object' ? service.name[lang] : service.name}</p>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{getDisplayRate ? getDisplayRate(service) : service.rate}</p>
              </div>
              <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={12} className="text-pink-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fixed duplicate className attributes
const QuickAction: React.FC<{ icon: React.ReactNode; label: string; bgColor: string; onClick: () => void }> = ({ icon, label, bgColor, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full p-4 ${bgColor} rounded-[20px] flex flex-col items-center gap-2 shadow-sm border-2 border-slate-100 active:scale-95 transition-all overflow-hidden`}
  >
    {icon}
    <span className="text-xs font-black text-slate-700 text-center line-clamp-2">{label}</span>
  </button>
);

export default HomeScreen;
