import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { API_BASE } from '../api';

type BookingItem = {
  _id: string;
  userId: string;
  serviceId: string;
  date: string;
  startHour: number;
  endHour: number;
  status: string;
};
type ServiceItem = { _id: string; name: string };
type UserItem = { _id: string; email?: string; phone?: string };

const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<BookingItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [view, setView] = useState<'list' | 'chart'>('list');
  const [chartServiceId, setChartServiceId] = useState('');
  const [chartDate, setChartDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const token = localStorage.getItem('token');

  const load = async () => {
    if (!token) return;
    try {
      console.log('📥 Fetching orders, services, users...');
      const r1 = await fetch(`${API_BASE}/api/admin/orders`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const r2 = await fetch(`${API_BASE}/api/admin/services`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const r3 = await fetch(`${API_BASE}/api/admin/users`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      if (!r1.ok) console.error('❌ Orders fetch failed:', r1.status);
      if (!r2.ok) console.error('❌ Services fetch failed:', r2.status);
      if (!r3.ok) console.error('❌ Users fetch failed:', r3.status);
      
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      const d3 = r3.ok ? await r3.json() : [];
      
      console.log('✅ Orders:', Array.isArray(d1) ? d1.length : 0);
      console.log('✅ Services:', Array.isArray(d2) ? d2.length : 0);
      console.log('✅ Users:', Array.isArray(d3) ? d3.length : 0);
      
      setOrders(Array.isArray(d1) ? d1 : []);
      setServices(Array.isArray(d2) ? d2 : []);
      setUsers(Array.isArray(d3) ? d3 : []);
    } catch (e) {
      console.error('❌ Order fetch error:', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cleanup = async () => {
    if (!token) return;
    await fetch(`${API_BASE}/api/admin/cleanup-orders`, { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    load();
  };

  const loadChart = async () => {
    if (!chartServiceId || !chartDate || !token) {
      console.warn('⚠️ Missing: serviceId, date, or token');
      return;
    }
    try {
      console.log('📊 Loading chart for:', { serviceId: chartServiceId, date: chartDate });
      const url = `${API_BASE}/api/admin/booking-chart?serviceId=${chartServiceId}&date=${chartDate}`;
      console.log('🔗 API URL:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.error('❌ Chart API error:', res.status, res.statusText);
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error details:', error);
        alert(`Error: ${error.error || res.statusText}`);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Chart data loaded:', data.slots?.length || 0, 'slots');
      console.log('📈 Chart response:', data);
      setChartData(data);
    } catch (e) {
      console.error('❌ Chart load error:', e);
      alert('Failed to load chart: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const nameByService = (id: string) => {
    const service = services.find(s => s._id === id);
    if (!service) return id;
    if (typeof service.name === 'object') return service.name?.en || service.name?.hi || 'Unknown';
    return service.name || id;
  };
  const userLabel = (id: string) => {
    const u = users.find(x => x._id === id);
    if (!u) return id;
    return u.email || u.phone || id;
  };
  const labelTime = (o: BookingItem) => `${o.startHour}:00-${o.endHour}:00`;

  const handleCall = (phone: string) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleNotification = async (booking: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const message = 'Aap tayar ho jaiye, aapka service time aa gaya hai! Jaldi parlor mein aa jaiye. ✨';
      
      const response = await fetch(`${API_BASE}/api/admin/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: booking.userId,
          bookingId: booking._id,
          message,
        }),
        credentials: 'include'
      });

      if (response.ok) {
        // Play sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        alert(`✅ Notification sent to ${booking.userName}!`);
        setSelectedBooking(null);
      } else {
        alert('❌ Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Error sending notification');
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-4 pb-24">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-lg font-black text-slate-800 truncate">Orders ({orders.length})</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setView(view === 'list' ? 'chart' : 'list')} 
              className="px-3 py-2 bg-teal-100 text-teal-700 rounded-[15px] font-black active:scale-95 text-xs whitespace-nowrap"
            >
              {view === 'list' ? '📊 Chart' : '📋 List'}
            </button>
            <button onClick={cleanup} className="px-3 py-2 bg-[#FFB7C5] text-white rounded-[15px] font-black active:scale-95 text-xs whitespace-nowrap">Cleanup</button>
          </div>
        </div>

        {view === 'chart' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-800">Booking Chart</h4>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Service</label>
                  <select 
                    value={chartServiceId} 
                    onChange={(e) => setChartServiceId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[10px] text-sm"
                  >
                    <option value="">Select Service</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>
                        {nameByService(s._id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Date</label>
                  <input 
                    type="date" 
                    value={chartDate}
                    onChange={(e) => setChartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[10px] text-sm"
                  />
                </div>
                <button 
                  onClick={loadChart}
                  className="w-full py-2.5 bg-teal-500 text-white font-bold rounded-[10px] active:scale-95"
                >
                  Load Chart
                </button>
              </div>
            </div>

            {chartData && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-800">{chartData.serviceName} - {chartData.date}</h4>
                <div className="grid gap-2">
                  {chartData.slots?.map((slot: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => slot.booking && setSelectedBooking(slot.booking)}
                      className={`p-3 rounded-[12px] border-2 text-left transition-all ${
                        slot.status === 'Booked' 
                          ? 'border-red-300 bg-red-50 hover:shadow-md cursor-pointer' 
                          : 'border-green-300 bg-green-50'
                      }`}
                    >
                      <div className="font-bold text-sm">{slot.timeLabel}</div>
                      <div className={`text-xs font-bold ${slot.status === 'Booked' ? 'text-red-600' : 'text-green-600'}`}>
                        {slot.status === 'Booked' ? `✅ ${slot.booking.userName}` : '🟢 Free'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No orders yet</div>
            ) : (
              orders.map(o => (
                <button
                  key={o._id}
                  onClick={() => setSelectedBooking(o)}
                  className="p-4 rounded-2xl border border-slate-200 space-y-2 bg-white shadow-sm hover:shadow-md transition-shadow w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">{userLabel(o.userId)}</div>
                      <div className="text-xs text-slate-500 line-clamp-2">{nameByService(o.serviceId)}</div>
                    </div>
                    <span className={`px-2.5 py-1.5 rounded-[10px] text-xs font-black whitespace-nowrap ${o.status === 'Done' ? 'bg-teal-100 text-teal-700' : o.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-[10px]">
                    📅 {o.date} • 🕐 {labelTime(o)}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-[30px] p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-slate-400 font-bold text-2xl">×</button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-[20px]">
                <div>
                  <p className="text-xs text-slate-500 font-bold">User</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.userName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">Service</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.serviceName || nameByService(selectedBooking.serviceId)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">Date & Time</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.date} • {selectedBooking.startHour}:00-{selectedBooking.endHour}:00</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCall(selectedBooking.userPhone)}
                  className="py-3 bg-green-500 text-white font-bold rounded-[15px] active:scale-95"
                >
                  📞 Call Now
                </button>
                <button
                  onClick={() => handleNotification(selectedBooking)}
                  className="py-3 bg-blue-500 text-white font-bold rounded-[15px] active:scale-95"
                >
                  🔔 Notify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default OrderManager;
