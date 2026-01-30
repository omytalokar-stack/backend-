
import React, { useEffect, useState } from 'react';
import { translations } from '../translations';
import { Service, Language, Order } from '../types';
import { MapPin, User, Calendar, CreditCard } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Props {
  service: Service;
  lang: Language;
  onConfirm: (order: Partial<Order>) => void;
  getDisplayRate?: (service: Service) => string;
}

const BookingPage: React.FC<Props> = ({ service, lang, onConfirm, getDisplayRate }) => {
  const t = translations[lang];
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    slot: '',
    startHour: 0,
    endHour: 0,
    cod: true,
    date: new Date().toISOString().slice(0, 10)
  });

  const [slots, setSlots] = useState<{ label: string; startHour: number; endHour: number }[]>([]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const date = new Date().toISOString().slice(0, 10);
    const id = (service as any)._id || service.id;
    
    if (!token || !id) {
      console.warn('⚠️ No token or service id, using fallback slots');
      // Fallback: 1 PM to 7 PM slots (13:00-19:00)
      setSlots([
        { label: '1:00 PM - 2:00 PM', startHour: 13, endHour: 14 },
        { label: '2:00 PM - 3:00 PM', startHour: 14, endHour: 15 },
        { label: '3:00 PM - 4:00 PM', startHour: 15, endHour: 16 },
        { label: '4:00 PM - 5:00 PM', startHour: 16, endHour: 17 },
        { label: '5:00 PM - 6:00 PM', startHour: 17, endHour: 18 },
        { label: '6:00 PM - 7:00 PM', startHour: 18, endHour: 19 }
      ]);
      return;
    }
    
    console.log('📥 Fetching available slots for:', { serviceId: id, date, token: !!token });
    fetch(`${API_BASE}/api/bookings/available?serviceId=${id}&date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) {
          console.error(`❌ Slot fetch failed: ${r.status}`);
          throw new Error(`${r.status}`);
        }
        return r.json();
      })
      .then(d => {
        console.log('✅ Slots fetched:', d.slots?.length || 0, 'available');
        const fetchedSlots = d.slots || [];
        if (fetchedSlots.length === 0) {
          console.warn('⚠️ No slots returned, using all 1-7 PM slots as available');
          setSlots([
            { label: '1:00 PM - 2:00 PM', startHour: 13, endHour: 14 },
            { label: '2:00 PM - 3:00 PM', startHour: 14, endHour: 15 },
            { label: '3:00 PM - 4:00 PM', startHour: 15, endHour: 16 },
            { label: '4:00 PM - 5:00 PM', startHour: 16, endHour: 17 },
            { label: '5:00 PM - 6:00 PM', startHour: 17, endHour: 18 },
            { label: '6:00 PM - 7:00 PM', startHour: 18, endHour: 19 }
          ]);
        } else {
          setSlots(fetchedSlots);
        }
      })
      .catch(err => {
        console.error('❌ Slot fetch error:', err);
        // Fallback to all 1-7 PM slots
        setSlots([
          { label: '1:00 PM - 2:00 PM', startHour: 13, endHour: 14 },
          { label: '2:00 PM - 3:00 PM', startHour: 14, endHour: 15 },
          { label: '3:00 PM - 4:00 PM', startHour: 15, endHour: 16 },
          { label: '4:00 PM - 5:00 PM', startHour: 16, endHour: 17 },
          { label: '5:00 PM - 6:00 PM', startHour: 17, endHour: 18 },
          { label: '6:00 PM - 7:00 PM', startHour: 18, endHour: 19 }
        ]);
      });
  }, [service]);

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-8 duration-300">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">{t.confirmBooking}</h2>
        <p className="text-slate-500 font-medium">Finalizing your {service.name[lang]}</p>
      </div>

      <div className="space-y-6">
        {/* Input Name */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 ml-4">{t.name}</label>
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-400" size={20} />
            <input 
              type="text" 
              placeholder="Ex. Priya Sharma"
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#FFB7C5] focus:bg-white rounded-[30px] outline-none transition-all font-bold"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
        </div>

        {/* Input Address */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 ml-4">{t.address}</label>
          <div className="relative">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-teal-400" size={20} />
            <input 
              type="text" 
              placeholder="Building No, Area, City"
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#E0F2F1] focus:bg-white rounded-[30px] outline-none transition-all font-bold"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </div>

        {/* Time Slot Picker */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-slate-400 ml-4 flex items-center gap-2">
            <Calendar size={14} /> {t.timeSlot}
          </label>
          <div className="flex flex-wrap gap-3">
            {slots.map(s => (
              <button
                key={s.label}
                onClick={() => setFormData({...formData, slot: s.label, startHour: s.startHour, endHour: s.endHour})}
                className={`px-5 py-2.5 rounded-[30px] font-bold text-sm transition-all border-2 ${
                  formData.slot === s.label 
                    ? 'bg-[#FFB7C5] text-white border-[#FFB7C5] shadow-md scale-105' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-pink-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* COD Toggle */}
        <div className="p-5 bg-[#FFF9C4]/30 rounded-[30px] border-2 border-[#FFF9C4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="text-yellow-600" />
            <div>
              <p className="font-bold text-slate-800">{t.cod}</p>
              <p className="text-[10px] uppercase font-black text-yellow-700/60">Pay after service</p>
            </div>
          </div>
          <button 
            onClick={() => setFormData({...formData, cod: !formData.cod})}
            className={`w-14 h-8 rounded-full transition-all relative ${formData.cod ? 'bg-yellow-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.cod ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Summary */}
        <div className="p-6 bg-slate-50 rounded-[30px] space-y-3">
          <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px]">
            <span>Service Total</span>
            <span>{getDisplayRate ? getDisplayRate(service) : (() => {
              const base = typeof service.baseRate === 'number' ? service.baseRate : parseInt(service.rate.replace(/[^\d]/g, ''), 10);
              const userRaw = localStorage.getItem('user');
              const user = userRaw ? JSON.parse(userRaw) : {};
              const isFirstTime = (typeof user.orderCount === 'number' ? user.orderCount === 0 : true);
              const discounted = service.offerOn || (user.isOfferActive && !user.isOfferUsed && isFirstTime);
              const price = discounted ? Math.round(base * 0.8) : base;
              return `₹${price}`;
            })()}</span>
          </div>
          <div className="flex justify-between text-slate-800 font-black text-lg">
            <span>Grand Total</span>
            <span className="text-pink-500">{getDisplayRate ? getDisplayRate(service) : (() => {
              const base = typeof service.baseRate === 'number' ? service.baseRate : parseInt(service.rate.replace(/[^\d]/g, ''), 10);
              const userRaw = localStorage.getItem('user');
              const user = userRaw ? JSON.parse(userRaw) : {};
              const isFirstTime = (typeof user.orderCount === 'number' ? user.orderCount === 0 : true);
              const discounted = service.offerOn || (user.isOfferActive && !user.isOfferUsed && isFirstTime);
              const price = discounted ? Math.round(base * 0.8) : base;
              return `₹${price}`;
            })()}</span>
          </div>
        </div>

        <button 
          onClick={() => onConfirm(formData)}
          disabled={!formData.name || !formData.address || !formData.slot}
          className="w-full py-5 bg-[#FFB7C5] disabled:bg-slate-200 text-white font-black text-xl rounded-[30px] shadow-lg active:scale-95 transition-all mt-4"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};

export default BookingPage;
