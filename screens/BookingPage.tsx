
import React, { useEffect, useState } from 'react';
import { translations } from '../translations';
import { Service, Language, Order } from '../types';
import { MapPin, User, Calendar, CreditCard } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  service: Service;
  serviceCart?: Service[];
  lang: Language;
  onConfirm: (order: Partial<Order>) => void;
  getDisplayRate?: (service: Service) => string;
}

const BookingPage: React.FC<Props> = ({ service, serviceCart, lang, onConfirm, getDisplayRate }) => {
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
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [holidayNote, setHolidayNote] = useState<string>('');
  const [fullService, setFullService] = useState<Service>(service);
  const [loadingService, setLoadingService] = useState(false);

  // Helper function to calculate the price for a single service
  const getPriceForService = (svc: Service): number => {
    if (!svc) return 0;
    const base = typeof svc.baseRate === 'number' ? svc.baseRate : parseInt(svc.rate.replace(/[^\d]/g, ''), 10) || 0;
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    const isFirstTime = (typeof user.orderCount === 'number' ? user.orderCount === 0 : true);
    const discounted = svc.offerOn || (user.isOfferActive && !user.isOfferUsed && isFirstTime);
    return discounted ? Math.round(base * 0.8) : base;
  };

  // Calculate grand total from all services in cart, or single service
  const calculateGrandTotal = (): number => {
    if (serviceCart && serviceCart.length > 0) {
      return serviceCart.reduce((sum, svc) => sum + getPriceForService(svc), 0);
    }
    return getPriceForService(fullService);
  };

  // Helper: Parse duration string to minutes
  const parseDurationToMinutes = (duration: string | undefined): number => {
    if (!duration) return 60; // default 1 hour
    const str = duration.toLowerCase();
    
    // Handle "150 min" format
    const minMatch = str.match(/(\d+(?:\.\d+)?)\s*m(?:in)?/);
    if (minMatch) return parseInt(minMatch[1], 10);
    
    // Handle "2.5 hours" or "2 hours 30 min" format
    const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*h(?:our)?/);
    if (hourMatch) {
      const hours = parseFloat(hourMatch[1]);
      const minPart = str.match(/(\d+)\s*m(?:in)?/);
      const mins = minPart ? parseInt(minPart[1], 10) : 0;
      return Math.round(hours * 60 + mins);
    }
    
    return 60; // default fallback
  };

  // Helper: Convert minutes to hours and minutes display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  // Calculate total duration from all services in cart
  const calculateTotalDuration = (): number => {
    if (serviceCart && serviceCart.length > 0) {
      return serviceCart.reduce((sum, svc) => sum + parseDurationToMinutes(svc.time), 0);
    }
    return parseDurationToMinutes(fullService?.time);
  };

  // Helper: Generate time slots with dynamic duration and buffer time
  const generateDynamicSlots = (availableSlots: any[], durationMinutes: number, bufferMinutes: number = 20): any[] => {
    const BUFFER = bufferMinutes; // 20 min buffer by default
    const durationHours = durationMinutes / 60;
    
    return availableSlots.map((slot: any) => {
      const endHour = slot.startHour + Math.ceil(durationHours);
      const endMinutes = (durationMinutes % 60);
      
      // Calculate actual end time with minutes
      let actualEndHour = slot.startHour;
      let actualEndMinutes = 0;
      
      let totalMinutes = (slot.startHour * 60) + durationMinutes;
      actualEndHour = Math.floor(totalMinutes / 60);
      actualEndMinutes = totalMinutes % 60;
      
      // Format times
      const startFormatted = `${String(slot.startHour).padStart(2, '0')}:00`;
      const endFormatted = actualEndMinutes === 0 
        ? `${String(actualEndHour).padStart(2, '0')}:00`
        : `${String(actualEndHour).padStart(2, '0')}:${String(actualEndMinutes).padStart(2, '0')}`;
      
      const startLabel = slot.startHour < 12 
        ? `${slot.startHour % 12 || 12}:00 AM`
        : slot.startHour === 12
        ? '12:00 PM'
        : `${slot.startHour - 12}:00 PM`;
      
      const endLabel = actualEndHour < 12
        ? `${actualEndHour % 12 || 12}:${String(actualEndMinutes).padStart(2, '0')} AM`
        : actualEndHour === 12
        ? `12:${String(actualEndMinutes).padStart(2, '0')} PM`
        : `${actualEndHour - 12}:${String(actualEndMinutes).padStart(2, '0')} PM`;

      return {
        label: `${startLabel} - ${endLabel}`,
        startHour: slot.startHour,
        endHour: actualEndHour,
        endMinutes: actualEndMinutes,
        originalEndHour: slot.startHour + Math.ceil(durationHours) // For conflict checking
      };
    });
  };

  // Ensure we have complete service data (especially important for Reel bookings)
  useEffect(() => {
    if (!service) return;
    
    const serviceId = (service as any)._id || service.id;
    const hasCompleteData = service.name && service.rate && service.time;
    
    if (hasCompleteData) {
      setFullService(service);
      return;
    }
    
    // Fetch complete service data
    console.log(`⏳ Booking: Fetching complete service data for ${serviceId}...`);
    setLoadingService(true);
    fetch(`${API_BASE}/api/admin/services-public/${serviceId}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            console.warn(`⚠️ Service ${serviceId} not found (404) - may be deleted`);
          }
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.name && data.rate) {
          setFullService(data);
          console.log(`✅ Booking: Service data loaded`);
        } else {
          setFullService(service);
        }
      })
      .catch(e => {
        console.error('❌ Booking: Error fetching service:', e);
        setFullService(service);
      })
      .finally(() => setLoadingService(false));
  }, [service]);
  
  
  // Validate that service has required data
  if (!service || !service.name || !service.rate) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-2xl font-black text-red-600 mb-4">⚠️ Service Data Missing</div>
          <div className="text-slate-600 font-semibold mb-6">
            Service details couldn't be loaded. Please go back and try again.
          </div>
          <p className="text-sm text-slate-500">Service ID: {(service as any)?._id || service?.id || 'Unknown'}</p>
        </div>
      </div>
    );
  }
  
  
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const date = formData.date; // use selected date
    const id = (fullService as any)._id || fullService.id;

    console.log(`📅 Date selected: ${date}, Service ID: ${id}`);

    // First check holidays for this date
    (async () => {
      setIsHoliday(false);
      setHolidayNote('');
      try {
        if (!date) return;
        const hRes = await fetch(`${API_BASE}/api/admin/holidays?date=${encodeURIComponent(date)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (hRes.ok) {
          const hd = await hRes.json();
          // Accept either array or single object
          if ((Array.isArray(hd) && hd.length > 0) || (hd && (hd.isHoliday || hd.date))) {
            setIsHoliday(true);
            if (Array.isArray(hd) && hd[0] && hd[0].note) setHolidayNote(hd[0].note);
            else if (hd.note) setHolidayNote(hd.note);
            setSlots([]);
            return; // Skip slot fetching when holiday
          }
        }
      } catch (e) {
        console.warn('Holiday check failed, proceeding to fetch slots', e);
      }

      if (!token || !id) {
        console.warn('⚠️ No token or service id, using fallback slots');
        // Fallback: 1 PM to 7 PM slots (13:00-19:00) with dynamic duration
        const totalDurationMin = calculateTotalDuration();
        const baseSlots = [
          { startHour: 13 },
          { startHour: 14 },
          { startHour: 15 },
          { startHour: 16 },
          { startHour: 17 },
          { startHour: 18 }
        ];
        setSlots(generateDynamicSlots(baseSlots, totalDurationMin));
        return;
      }

      const url = `${API_BASE}/api/bookings/available?serviceId=${id}&date=${date}&durationMinutes=${calculateTotalDuration()}`;
      console.log(`🔗 Fetching slots from: ${url}`);

      fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => {
          if (!r.ok) {
            console.error(`❌ Slot fetch failed: ${r.status} ${r.statusText}`);
            if (r.status === 404) {
              console.warn(`⚠️ Service ${id} not found (404) - may be deleted`);
              throw new Error('Service not found');
            }
            throw new Error(`${r.status}`);
          }
          return r.json();
        })
        .then(d => {
          console.log('✅ Slots fetched:', d.slots?.length || 0, 'available');
          const fetchedSlots = (d.slots || []).filter((s: any) => s && typeof s.startHour === 'number');
          const totalDurationMin = calculateTotalDuration();

          if (fetchedSlots.length === 0) {
            console.warn('⚠️ No slots returned, using all 1-7 PM slots as available');
            const baseSlots = [
              { startHour: 13 },
              { startHour: 14 },
              { startHour: 15 },
              { startHour: 16 },
              { startHour: 17 },
              { startHour: 18 }
            ];
            setSlots(generateDynamicSlots(baseSlots, totalDurationMin));
          } else {
            setSlots(generateDynamicSlots(fetchedSlots, totalDurationMin));
          }
        })
        .catch(err => {
          console.error('❌ Slot fetch error:', err);
          // Fallback to all 1-7 PM slots
          const totalDurationMin = calculateTotalDuration();
          const baseSlots = [
            { startHour: 13 },
            { startHour: 14 },
            { startHour: 15 },
            { startHour: 16 },
            { startHour: 17 },
            { startHour: 18 }
          ];
          setSlots(generateDynamicSlots(baseSlots, totalDurationMin));
        });
    })();
  }, [fullService, formData.date, serviceCart]);

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-8 duration-300">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">{t.confirmBooking}</h2>
        <p className="text-slate-500 font-medium">Finalizing your {fullService.name[lang]}</p>
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

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 ml-4">Date</label>
          <div className="relative">
            <input
              type="date"
              className="w-full pl-6 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#E0F2F1] focus:bg-white rounded-[30px] outline-none transition-all font-bold"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        {/* Time Slot Picker */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-slate-400 ml-4 flex items-center gap-2">
            <Calendar size={14} /> {t.timeSlot}
          </label>
          <div className="flex flex-wrap gap-3">
            {isHoliday ? (
              <div className="w-full text-center py-8 text-2xl font-black text-red-600 bg-red-50 rounded-lg">
                This day is a Holiday{holidayNote ? ` — ${holidayNote}` : ''}
              </div>
            ) : (
              (() => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const isToday = formData.date === todayStr;
                const now = new Date();
                const currentHourFloat = now.getHours() + (now.getMinutes() / 60);
                const minAllowedHour = Math.ceil(currentHourFloat); // Only slots AFTER current time
                
                const filtered = slots.filter(s => {
                  if (!isToday) return true;
                  // For today, only show slots that start AFTER current hour
                  return (typeof s.startHour === 'number') ? s.startHour > currentHourFloat : true;
                });
                
                // If current selected slot is now invalid, clear it
                if (isToday && formData.slot) {
                  const stillValid = filtered.find(fs => fs.label === formData.slot);
                  if (!stillValid) {
                    setFormData({ ...formData, slot: '', startHour: 0, endHour: 0 });
                  }
                }
                
                return (
                  <>
                    {isToday && filtered.length < slots.length && (
                      <div className="w-full text-xs text-amber-600 bg-amber-50 p-2.5 rounded-[12px] font-semibold">
                        ⏰ Past time slots are hidden for today. Only future slots are available.
                      </div>
                    )}
                    {filtered.length === 0 ? (
                      <div className="w-full text-center py-4 text-slate-500 text-sm font-semibold">
                        No available slots for this date
                      </div>
                    ) : (
                      filtered.map(s => (
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
                      ))
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Order Summary - Show all services in cart */}
        {serviceCart && serviceCart.length > 0 && (
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-[30px] space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-600">Order Summary</h3>
            <div className="space-y-3">
              {serviceCart.map((svc, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">{svc.name[lang]}</p>
                    <p className="text-xs text-slate-500">{svc.time || '1 hour'}</p>
                  </div>
                  <span className="font-black text-pink-500">₹{getPriceForService(svc)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-6 bg-slate-50 rounded-[30px] space-y-4">
          {/* Total Duration */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
            <span className="text-sm font-bold text-slate-600">⏱️ Total Duration</span>
            <span className="text-lg font-black text-blue-600">{formatDuration(calculateTotalDuration())}</span>
          </div>

          <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px]">
            <span>{serviceCart && serviceCart.length > 1 ? `Services (${serviceCart.length})` : 'Service'} Total</span>
            <span>₹{calculateGrandTotal()}</span>
          </div>
          <div className="flex justify-between text-slate-800 font-black text-lg">
            <span>Grand Total</span>
            <span className="text-pink-500">₹{calculateGrandTotal()}</span>
          </div>
        </div>

        <button 
          onClick={() => onConfirm(formData)}
          disabled={!formData.name || !formData.address || !formData.slot || isHoliday}
          className="w-full py-5 bg-[#FFB7C5] disabled:bg-slate-200 text-white font-black text-xl rounded-[30px] shadow-lg active:scale-95 transition-all mt-4"
        >
          {isHoliday ? 'Holiday' : t.bookNow}
        </button>
      </div>
    </div>
  );
};

export default BookingPage;

