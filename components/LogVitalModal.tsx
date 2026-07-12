
import React, { useState } from 'react';
import { X, Check, Activity, Weight, Droplets, Smile, Calendar, Save } from 'lucide-react';
import { HealthLog } from '../types';

interface LogVitalModalProps {
  onClose: () => void;
  onLog: (log: Omit<HealthLog, 'id' | 'profileId'>) => void;
}

const LogVitalModal: React.FC<LogVitalModalProps> = ({ onClose, onLog }) => {
  const [type, setType] = useState<HealthLog['type']>('blood_pressure');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const metricConfig = {
    blood_pressure: { label: 'Blood Pressure', unit: 'mmHg', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
    glucose: { label: 'Blood Glucose', unit: 'mg/dL', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
    weight: { label: 'Weight', unit: 'kg', icon: Weight, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    mood: { label: 'Mood Score', unit: '1-10', icon: Smile, color: 'text-amber-500', bg: 'bg-amber-50' },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    onLog({
      type,
      value,
      unit: metricConfig[type].unit,
      date
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Record Vital</h3>
            <p className="text-sm text-slate-500 font-medium">Log your current health metrics</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((mKey) => {
              const config = metricConfig[mKey];
              const Icon = config.icon;
              const isActive = type === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setType(mKey)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${
                    isActive 
                      ? 'bg-white border-blue-500 shadow-lg scale-105' 
                      : 'bg-slate-50 border-transparent text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? config.bg + ' ' + config.color : 'bg-white text-slate-300'}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-slate-800' : ''}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value ({metricConfig[type].unit})</label>
              <div className="relative">
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder={`e.g. ${type === 'blood_pressure' ? '120/80' : '75'}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 font-black text-2xl text-slate-800 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Entry</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 font-medium"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button 
            type="submit"
            onClick={handleSubmit}
            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Save size={24} strokeWidth={3} /> Save Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogVitalModal;
