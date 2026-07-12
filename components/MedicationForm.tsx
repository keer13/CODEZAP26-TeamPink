
import React, { useState, useEffect } from 'react';
import { 
  X, Pill, Save, Hash, Info, Calendar, 
  MessageSquareText, Clock, Plus, Trash2, 
  ListChecks, Sun, Sunrise, Sunset, Moon,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { Medication } from '../types';

interface MedicationFormProps {
  onClose: () => void;
  onSave: (med: Omit<Medication, 'id' | 'profileId'>) => void;
}

const PRESETS = [
  { label: 'Morning', time: '08:00', icon: Sunrise, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Noon', time: '12:00', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Evening', time: '18:00', icon: Sunset, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Bedtime', time: '21:00', icon: Moon, color: 'text-slate-500', bg: 'bg-slate-50' },
];

const FREQUENCY_MAP: Record<string, number> = {
  'Once Daily': 1,
  'Twice Daily': 2,
  'Three Times Daily': 3,
  'Four Times Daily': 4,
  'As Needed': 0
};

const MedicationForm: React.FC<MedicationFormProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Once Daily',
    total: 30,
    instructions: '',
    reminderTimes: ['08:00'],
    reminderMessage: '',
    lowStockThreshold: 5
  });

  // Automatically suggest times when frequency changes if schedule is fresh
  useEffect(() => {
    const targetCount = FREQUENCY_MAP[formData.frequency] || 0;
    if (targetCount > 0 && formData.reminderTimes.length === 0) {
      const suggested = ['08:00', '12:00', '18:00', '21:00'].slice(0, targetCount);
      setFormData(prev => ({ ...prev, reminderTimes: suggested }));
    }
  }, [formData.frequency]);

  const handleAddTime = (specificTime?: string) => {
    const timeToAdd = specificTime || '09:00';
    if (formData.reminderTimes.includes(timeToAdd)) return;
    
    setFormData({ 
      ...formData, 
      reminderTimes: [...formData.reminderTimes, timeToAdd].sort() 
    });
  };

  const handleRemoveTime = (index: number) => {
    const updated = formData.reminderTimes.filter((_, i) => i !== index);
    setFormData({ ...formData, reminderTimes: updated });
  };

  const handleTimeChange = (index: number, value: string) => {
    const updated = [...formData.reminderTimes];
    updated[index] = value;
    setFormData({ ...formData, reminderTimes: updated.sort() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dosage) return;

    onSave({
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      timeOfDay: formData.reminderTimes,
      remaining: formData.total,
      total: formData.total,
      instructions: formData.instructions,
      lowStockThreshold: formData.lowStockThreshold,
      reminders: formData.reminderTimes.map(time => ({
        id: Math.random().toString(36).substr(2, 9),
        time: time,
        enabled: true,
        message: formData.reminderMessage || `Time for your ${formData.name}`
      }))
    });
  };

  const dosesRequired = FREQUENCY_MAP[formData.frequency] || 0;
  const isCorrectCount = dosesRequired === 0 || formData.reminderTimes.length === dosesRequired;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Pill size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Add Medication</h3>
              <p className="text-sm text-slate-500 font-semibold tracking-tight">Create a new treatment schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-all active:scale-90">
            <X size={28} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide bg-slate-50/30">
          
          {/* Section 1: Medication Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Identity</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 relative group">
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder="Medication Name (e.g. Atorvastatin)"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 shadow-sm focus:shadow-xl focus:shadow-blue-500/5 transition-all font-bold text-lg placeholder:text-slate-300"
                />
              </div>

              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Info size={20} />
                </div>
                <input 
                  required
                  type="text" 
                  placeholder="Dosage (e.g. 20mg)"
                  value={formData.dosage}
                  onChange={e => setFormData({...formData, dosage: e.target.value})}
                  className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 shadow-sm transition-all font-bold"
                />
              </div>

              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar size={20} />
                </div>
                <select 
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                  className="w-full pl-14 pr-10 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 shadow-sm transition-all font-bold appearance-none cursor-pointer"
                >
                  <option>Once Daily</option>
                  <option>Twice Daily</option>
                  <option>Three Times Daily</option>
                  <option>Four Times Daily</option>
                  <option>As Needed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Schedule Builder */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Builder</h4>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isCorrectCount ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {isCorrectCount ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {formData.reminderTimes.length} / {dosesRequired || '∞'} Dose slots
              </div>
            </div>

            {/* Smart Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAddTime(preset.time)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 border-dashed transition-all hover:border-solid hover:scale-105 active:scale-95 ${preset.bg} ${preset.color} border-slate-200 hover:border-blue-400 group`}
                >
                  <preset.icon size={24} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tight">{preset.label}</span>
                  <span className="text-xs font-bold opacity-60 leading-none">{preset.time}</span>
                </button>
              ))}
            </div>
            
            {/* Active Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-white rounded-[40px] border border-slate-100 shadow-inner">
              {formData.reminderTimes.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <Clock size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold text-slate-400">Click a preset above to add your first dose time.</p>
                </div>
              )}
              {formData.reminderTimes.map((time, idx) => (
                <div key={idx} className="relative group animate-in zoom-in-90 duration-300">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10">
                    <Clock size={18} />
                  </div>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    className="w-full pl-12 pr-12 py-5 bg-blue-50/50 border-2 border-transparent hover:border-blue-200 focus:border-blue-500 rounded-3xl text-blue-700 font-black focus:outline-none transition-all text-xl"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTime(idx)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-300 hover:text-red-500 hover:shadow-md rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => handleAddTime()}
                className="flex items-center justify-center gap-2 py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all font-black text-sm active:scale-95"
              >
                <Plus size={20} /> Custom Time
              </button>
            </div>
          </div>

          {/* Section 3: Logistics & Notes */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics & Support</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Total Pill Count</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Hash size={18} />
                  </div>
                  <input 
                    required
                    type="number" 
                    value={formData.total}
                    onChange={e => setFormData({...formData, total: parseInt(e.target.value) || 0})}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 shadow-sm transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Low Stock Warning Threshold</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
                    <AlertCircle size={18} />
                  </div>
                  <input 
                    required
                    type="number" 
                    value={formData.lowStockThreshold}
                    onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value) || 0})}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 shadow-sm transition-all font-bold text-amber-600 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Alarm Message</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <MessageSquareText size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. Take with breakfast"
                    value={formData.reminderMessage}
                    onChange={e => setFormData({...formData, reminderMessage: e.target.value})}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 shadow-sm transition-all font-bold"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Clinical Instructions</label>
                <div className="relative">
                  <div className="absolute left-6 top-6 text-slate-400 pointer-events-none">
                    <ListChecks size={20} />
                  </div>
                  <textarea 
                    placeholder="List specific instructions from your doctor here..."
                    rows={3}
                    value={formData.instructions}
                    onChange={e => setFormData({...formData, instructions: e.target.value})}
                    className="w-full pl-14 pr-6 py-6 bg-white border-2 border-slate-100 rounded-[32px] focus:outline-none focus:border-blue-600 shadow-sm transition-all font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 sticky bottom-0 z-20">
          <button 
            type="button"
            onClick={onClose}
            className="px-8 py-5 bg-slate-100 text-slate-600 rounded-[28px] font-black hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            className="flex-1 py-5 bg-blue-600 text-white rounded-[28px] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Save size={24} strokeWidth={3} /> Record Treatment
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationForm;
