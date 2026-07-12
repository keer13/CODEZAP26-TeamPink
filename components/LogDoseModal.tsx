import React, { useState } from 'react';
import { X, Check, Clock, Calendar, Pill, Zap } from 'lucide-react';
import { Medication } from '../types';

interface LogDoseModalProps {
  medication: Medication;
  onClose: () => void;
  onLog: (medId: string, time: string, date: string) => void;
}

const LogDoseModal: React.FC<LogDoseModalProps> = ({ medication, onClose, onLog }) => {
  const now = new Date();
  const [time, setTime] = useState(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
  const [date, setDate] = useState(now.toISOString().split('T')[0]);

  const handleQuickLogNow = () => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toISOString().split('T')[0];
    onLog(medication.id, currentTime, currentDate);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Log Dose</h3>
            <p className="text-sm text-slate-500 font-medium">Confirm when you took this</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-3xl border border-blue-100">
            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Pill size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{medication.name}</h4>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{medication.dosage}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Taken</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 font-bold text-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 font-medium text-sm"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleQuickLogNow}
            className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <Zap size={18} fill="currentColor" /> Log for Exactly Now
          </button>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={() => onLog(medication.id, time, date)}
            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Check size={24} strokeWidth={3} /> Record Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogDoseModal;