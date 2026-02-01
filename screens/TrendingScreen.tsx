
import React from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { TrendingUp, Star, ChevronRight, Search, X } from 'lucide-react';

interface Props {
  lang: Language;
  services: Service[];
  onSelect: (service: Service) => void;
  getDisplayRate?: (s: Service) => string;
}

const TrendingScreen: React.FC<Props> = ({ lang, services, onSelect, getDisplayRate }) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  
  const categories = ['Bleach', 'Makeup', 'Facial', 'Cleanup', 'Waxing', 'Hair Cut', 'Hair Style', 'Polishing'];
  
  // Filter services based on search and category
  const filteredServices = React.useMemo(() => {
    return services.filter(service => {
      const serviceName = typeof service.name === 'object' ? service.name[lang] : service.name;
      const matchesSearch = serviceName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory, lang]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-pink-100 rounded-[20px] text-pink-500">
          <TrendingUp size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-800">{t.trendingServices}</h2>
      </div>

      {/* Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 border-2 border-slate-200 rounded-[20px] text-sm font-medium focus:outline-none focus:border-[#FFB7C5] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-4 py-2.5 rounded-[20px] font-bold text-sm transition-all ${
            selectedCategory === null
              ? 'bg-[#FFB7C5] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-[20px] font-bold text-sm transition-all ${
              selectedCategory === category
                ? 'bg-[#FFB7C5] text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!filteredServices || filteredServices.length === 0 ? (
          <p className="text-slate-400 col-span-2 text-center py-8">No services found</p>
        ) : filteredServices.map((service, idx) => {
          if (!service) return null;
          const API_BASE = import.meta.env.VITE_API_URL || '';
          const thumbUrl = (service as any).imageUrl && (service.imageUrl as string) ? `${((service.imageUrl as string) || '').startsWith('http') ? service.imageUrl : API_BASE + '/' + service.imageUrl}` : (service.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="180"%3E%3Crect fill="%23f1f5f9" width="160" height="180"/%3E%3C/svg%3E');
          return (
          <div 
            key={`${service._id || service.id}-${idx}`}
            onClick={() => onSelect(service)}
            className="flex flex-col bg-white rounded-[20px] border-2 border-slate-50 shadow-sm hover:shadow-lg hover:border-[#FFB7C5] transition-all cursor-pointer active:scale-[0.95] overflow-hidden"
          >
            <div className="relative w-full h-40 bg-slate-100">
              <img 
                src={thumbUrl} 
                alt={typeof service.name === 'object' ? service.name[lang] : 'Service'} 
                className="w-full h-full object-cover" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = (service as any).thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="180"%3E%3Crect fill="%23f1f5f9" width="160" height="180"/%3E%3C/svg%3E'; }}
              />
              <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center font-black text-slate-800 text-sm shadow-sm border-2 border-slate-50">
                {idx + 1}
              </div>
            </div>
            
            <div className="p-3 flex flex-col gap-2">
              <h4 className="font-black text-slate-800 text-sm line-clamp-2">{typeof service.name === 'object' ? service.name[lang] : service.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1">{typeof service.features === 'object' ? (service.features[lang] || '').split(',')[0] : ''}</p>
              <div className="flex items-center justify-between">
                <span className="text-pink-500 font-black text-sm">{getDisplayRate ? getDisplayRate(service) : service.rate}</span>
                <Star size={14} className="text-yellow-500" fill="currentColor" />
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingScreen;
