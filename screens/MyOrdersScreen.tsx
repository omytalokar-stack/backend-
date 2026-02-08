
import React, { useState } from 'react';
import { translations } from '../translations';
import { Order, Language } from '../types';
import { CheckCircle2, Clock, Box } from 'lucide-react';

interface Props {
  orders: Order[];
  lang: Language;
}

const MyOrdersScreen: React.FC<Props> = ({ orders, lang }) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'Pending' | 'Done'>('Pending');

  const filteredOrders = orders.filter(o => o.status === tab);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 p-2 bg-slate-100 rounded-[30px]">
        <button 
          onClick={() => setTab('Pending')}
          className={`flex-1 py-3 rounded-[25px] font-black text-sm uppercase tracking-wider transition-all ${
            tab === 'Pending' ? 'bg-[#FFB7C5] text-white shadow-md' : 'text-slate-400'
          }`}
        >
          {t.pending}
        </button>
        <button 
          onClick={() => setTab('Done')}
          className={`flex-1 py-3 rounded-[25px] font-black text-sm uppercase tracking-wider transition-all ${
            tab === 'Done' ? 'bg-[#E0F2F1] text-teal-800 shadow-md' : 'text-slate-400'
          }`}
        >
          {t.done}
        </button>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 space-y-4 opacity-40">
            <Box size={60} className="mx-auto" />
            <p className="font-bold">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const hasServices = (order as any).services && Array.isArray((order as any).services) && (order as any).services.length > 0;
            const servicesList = hasServices ? (order as any).services : [{ serviceName: order.serviceName, price: parseFloat(order.rate?.replace(/[^\d]/g, '') || '0') || 0 }];
            const totalPrice = servicesList.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
            
            return (
              <div key={order.id} className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-[30px] border-2 border-purple-100 shadow-md space-y-4 group hover:shadow-lg transition-all">
                {/* Header */}
                <div className="space-y-2 border-b-2 border-purple-200 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-purple-200 text-purple-700 rounded-full">📦 Combo</span>
                    <span className="text-xs font-bold text-slate-500">{order.date}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ml-auto ${tab === 'Done' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {tab === 'Done' ? '✅ Done' : '⏳ Pending'}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-800 text-xl">
                    {servicesList.length === 1 ? order.serviceName : `${servicesList.length} Services Order`}
                  </h4>
                </div>
                
                {/* Services List */}
                {servicesList.length > 0 && (
                  <div className="space-y-2">
                    {servicesList.map((svc: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-[12px] border-2 border-slate-100 flex justify-between items-center hover:border-pink-200 transition-all">
                        <div>
                          <p className="font-black text-slate-800">{svc.serviceName || 'Service'}</p>
                          <p className="text-xs text-slate-500 mt-1">⏱️ {svc.duration || '1 hour'}</p>
                        </div>
                        <span className="text-lg font-black text-pink-600">Rs {svc.price || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Total Bill */}
                <div className="bg-white p-4 rounded-[16px] border-2 border-slate-100 flex justify-between items-center">
                  <span className="font-black text-slate-700">Total Bill:</span>
                  <span className="text-2xl font-black text-pink-600">Rs {totalPrice}</span>
                </div>
                
                {/* Status Icon */}
                <div className="flex justify-center">
                  {tab === 'Done' ? <CheckCircle2 className="text-teal-600" size={32} /> : <Clock className="text-yellow-600" size={32} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrdersScreen;
