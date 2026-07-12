import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Clock, Stethoscope, Pill, FlaskConical, Activity,
  FileText, Scissors, AlertTriangle, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { MedicalHistoryEntry, MedicalHistoryType, UserProfile } from '../types';
import { dbService } from '../services/dbService';

interface MedicalHistoryModalProps {
  patient: UserProfile;
  isDoctor?: boolean;
  doctorName?: string;
  onClose: () => void;
}

const TYPE_META: Record<MedicalHistoryType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  diagnosis:    { label: 'Diagnosis',    color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200',    icon: <Stethoscope size={15} /> },
  prescription: { label: 'Prescription', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',    icon: <Pill size={15} /> },
  lab_result:   { label: 'Lab Result',   color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',icon: <FlaskConical size={15} /> },
  vital:        { label: 'Vital Sign',   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',icon: <Activity size={15} /> },
  note:         { label: 'Note',         color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',  icon: <FileText size={15} /> },
  surgery:      { label: 'Surgery',      color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',icon: <Scissors size={15} /> },
  allergy:      { label: 'Allergy',      color: 'text-red-600',     bg: 'bg-red-50 border-red-200',      icon: <AlertTriangle size={15} /> },
};

const MedicalHistoryModal: React.FC<MedicalHistoryModalProps> = ({ patient, isDoctor = false, doctorName, onClose }) => {
  const [entries, setEntries] = useState<MedicalHistoryEntry[]>(() =>
    dbService.getMedicalHistory(patient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MedicalHistoryType | 'all'>('all');
  const [form, setForm] = useState({
    type: 'diagnosis' as MedicalHistoryType,
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAdd = () => {
    if (!form.title.trim() || !form.description.trim()) return;
    const newEntry: MedicalHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: patient.id,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      doctorName: isDoctor ? doctorName : undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    dbService.saveMedicalHistory(patient.id, updated);
    setForm({ type: 'diagnosis', title: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowAddForm(false);
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black">Medical History</h2>
                <p className="text-indigo-200 text-sm font-medium">{patient.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-4 flex gap-3 flex-wrap">
            {(['all', 'diagnosis', 'prescription', 'lab_result', 'vital'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  filter === t ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {t === 'all' ? `All (${entries.length})` : TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Entry Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all text-sm"
          >
            <Plus size={16} />
            Add Medical History Entry
          </button>

          {/* Add Entry Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 space-y-4">
                  <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">New Entry</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Type</label>
                      <select
                        value={form.type}
                        onChange={e => setForm(p => ({ ...p, type: e.target.value as MedicalHistoryType }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {Object.entries(TYPE_META).map(([key, m]) => (
                          <option key={key} value={key}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Type 2 Diabetes Diagnosis"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Details</label>
                    <textarea
                      rows={3}
                      placeholder="Clinical notes, dosage, observations..."
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAdd}
                      disabled={!form.title.trim() || !form.description.trim()}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      Save Entry
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeline */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Clock size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No history entries yet</p>
              <p className="text-sm mt-1">Add the first entry to begin the timeline.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-violet-200 to-transparent" />
              <div className="space-y-4">
                {filtered.map(entry => {
                  const meta = TYPE_META[entry.type];
                  const isExpanded = expandedId === entry.id;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4"
                    >
                      {/* Dot */}
                      <div className={`relative z-10 w-12 h-12 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </div>
                      {/* Card */}
                      <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                                {meta.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">{entry.date}</span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm">{entry.title}</p>
                            {entry.doctorName && (
                              <p className="text-xs text-slate-400 mt-0.5">By {entry.doctorName}</p>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400 mt-1 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 mt-1 flex-shrink-0" />}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                                <p className="text-sm text-slate-600 leading-relaxed mt-3">{entry.description}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MedicalHistoryModal;
