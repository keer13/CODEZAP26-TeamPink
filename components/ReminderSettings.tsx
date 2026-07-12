
import React, { useState } from 'react';
import { X, Plus, Bell, BellOff, Trash2, Clock, MessageSquareText, Power, AlertCircle } from 'lucide-react';
import { Medication, Reminder } from '../types';

interface ReminderSettingsProps {
  medication: Medication;
  onClose: () => void;
  onUpdateReminders: (medId: string, reminders: Reminder[], remaining: number, lowStockThreshold: number) => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ medication, onClose, onUpdateReminders }) => {
  const [reminders, setReminders] = useState<Reminder[]>([...medication.reminders]);
  const [remaining, setRemaining] = useState<number>(medication.remaining ?? medication.total);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(medication.lowStockThreshold ?? 5);
  const [newTime, setNewTime] = useState('08:00');
  const [newMessage, setNewMessage] = useState('');

  const handleAddReminder = () => {
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      time: newTime,
      enabled: true,
      message: newMessage || `Time for your ${medication.name}`
    };
    const updated = [...reminders, newReminder].sort((a, b) => a.time.localeCompare(b.time));
    setReminders(updated);
    setNewMessage('');
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setReminders(updated);
  };

  const removeReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
  };

  const updateMessage = (id: string, msg: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, message: msg } : r);
    setReminders(updated);
  };

  const saveAndClose = () => {
    onUpdateReminders(medication.id, reminders, remaining, lowStockThreshold);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800">Alarm Schedule</h3>
            <p className="text-sm text-slate-500 font-medium">{medication.name}</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {/* Stock control section */}
          <div className="p-5 bg-amber-50/60 rounded-3xl border border-amber-100/80 space-y-4">
            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-500" /> Stock Control & Threshold
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Remaining Units</label>
                <input 
                  type="number" 
                  value={remaining}
                  onChange={(e) => setRemaining(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2 bg-white border border-amber-200/60 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none shadow-sm focus:ring-2 ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Low Threshold</label>
                <input 
                  type="number" 
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2 bg-white border border-amber-200/60 rounded-xl text-amber-600 font-extrabold text-sm focus:outline-none shadow-sm focus:ring-2 ring-amber-500/20"
                />
              </div>
            </div>
            {remaining <= lowStockThreshold && (
              <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider bg-amber-100/50 px-3 py-1.5 rounded-xl flex items-center gap-1 animate-pulse">
                ⚠️ Current stock is below threshold!
              </div>
            )}
          </div>

          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-1">Set Time</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-blue-700 font-bold text-lg focus:outline-none shadow-sm focus:ring-2 ring-blue-500/20"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddReminder}
                className="mt-5 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:scale-105"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-1">Alarm Note</label>
              <input 
                type="text"
                placeholder="e.g., Take with breakfast"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none focus:ring-2 ring-blue-500/20 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Alarms</h4>
            {reminders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-sm font-medium border-2 border-dashed border-slate-100 rounded-3xl">
                No real-time alarms scheduled yet.
              </div>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className={`p-5 rounded-3xl border-2 transition-all space-y-4 ${
                  reminder.enabled ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        reminder.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <span className="text-xl font-black text-slate-700">{reminder.time}</span>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${reminder.enabled ? 'text-indigo-400' : 'text-slate-400'}`}>
                          {reminder.enabled ? 'Alarm Active' : 'Muted'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleReminder(reminder.id)}
                        className={`p-3 rounded-2xl transition-all ${
                          reminder.enabled 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                        title={reminder.enabled ? "Mute Alarm" : "Enable Alarm"}
                      >
                        <Power size={18} />
                      </button>
                      <button 
                        onClick={() => removeReminder(reminder.id)}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        title="Delete Alarm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus-within:bg-white focus-within:ring-2 ring-blue-500/10 transition-all">
                    <MessageSquareText size={16} className="text-slate-400 flex-shrink-0" />
                    <input 
                      type="text"
                      value={reminder.message || ''}
                      onChange={(e) => updateMessage(reminder.id, e.target.value)}
                      className="bg-transparent text-sm font-bold text-slate-600 w-full focus:outline-none"
                      placeholder={`Time for your ${medication.name}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 sticky bottom-0">
          <button 
            onClick={saveAndClose}
            className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all"
          >
            Update Alarm System
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;
