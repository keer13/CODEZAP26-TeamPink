
import React, { useEffect, useState } from 'react';
import { Pill, X, Check, BellRing, Volume2, VolumeX } from 'lucide-react';
import { Medication, Reminder } from '../types';

interface MedicationAlarmProps {
  medication: Medication;
  reminder: Reminder;
  onDismiss: () => void;
  onTake: (medId: string) => void;
}

const MedicationAlarm: React.FC<MedicationAlarmProps> = ({ medication, reminder, onDismiss, onTake }) => {
  const [isMuted, setIsMuted] = useState(false);

  // Play a gentle notification sound if possible
  useEffect(() => {
    if (!isMuted) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.loop = true;
      audio.play().catch(() => console.log("Audio playback blocked by browser"));
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [isMuted]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        {/* Animated Background Pulse */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="p-8 flex flex-col items-center text-center relative z-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="relative w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-200">
              <Pill size={48} />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 animate-bounce">
              <BellRing size={20} />
            </div>
          </div>

          <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-2">Medication Reminder</h2>
          <h3 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{medication.name}</h3>
          <p className="text-lg font-bold text-slate-500 mb-6">{medication.dosage} • {reminder.time}</p>
          
          <div className="w-full bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-8">
            <p className="text-blue-900 font-bold leading-relaxed italic">
              "{reminder.message || 'Time to take your scheduled dose.'}"
            </p>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={() => onTake(medication.id)}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Check size={24} strokeWidth={3} /> I've Taken It
            </button>
            <button 
              onClick={onDismiss}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <X size={20} /> Remind in 5 mins
            </button>
          </div>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="mt-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationAlarm;
