import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, User, Stethoscope, Building2, Phone, Clock,
  FileText, MapPin, Shield, Bell, Wifi, WifiOff, Check,
  Save, Lock, AlertCircle, ChevronRight, Mail, Hash,
  ToggleLeft, ToggleRight, Activity, X, Edit3, CheckCircle
} from 'lucide-react';
import { Doctor } from '../types';

interface DoctorSettingsProps {
  activeDoctor: Doctor | null;
  doctorEmail: string;
  doctorName: string;
  onUpdateDoctor: (updated: Doctor) => void;
  onClose: () => void;
}

type SettingsSection = 'profile' | 'availability' | 'notifications' | 'security';

const SECTION_META: Record<SettingsSection, { label: string; icon: React.ReactNode; desc: string }> = {
  profile:       { label: 'Profile',       icon: <User size={18} />,        desc: 'Name, specialty, hospital & contact' },
  availability:  { label: 'Availability',  icon: <Activity size={18} />,    desc: 'Online/offline status & hours' },
  notifications: { label: 'Notifications', icon: <Bell size={18} />,        desc: 'Alerts and message preferences' },
  security:      { label: 'Security',      icon: <Shield size={18} />,      desc: 'License, credentials & access' },
};

const DoctorSettings: React.FC<DoctorSettingsProps> = ({
  activeDoctor,
  doctorEmail,
  doctorName,
  onUpdateDoctor,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [saved, setSaved] = useState(false);

  // Form state — initialized from activeDoctor
  const [form, setForm] = useState({
    name: activeDoctor?.name || doctorName || '',
    specialty: activeDoctor?.specialty || '',
    hospital: activeDoctor?.hospital || '',
    licenseNumber: activeDoctor?.licenseNumber || '',
    phone: activeDoctor?.phone || '',
    consultationHours: activeDoctor?.consultationHours || 'Mon–Fri 9:00 AM – 5:00 PM',
    biography: activeDoctor?.biography || '',
    room: activeDoctor?.room || '',
  });

  // Availability / notification toggles
  const [isOnline, setIsOnline] = useState<boolean>(activeDoctor?.isOnline ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    activeDoctor?.notificationsEnabled ?? true
  );
  const [notifyNewMsg, setNotifyNewMsg] = useState(true);
  const [notifyRequest, setNotifyRequest] = useState(true);
  const [notifyAppointment, setNotifyAppointment] = useState(true);

  const handleSave = () => {
    if (!activeDoctor) return;
    const updated: Doctor = {
      ...activeDoctor,
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      hospital: form.hospital.trim(),
      licenseNumber: form.licenseNumber.trim(),
      phone: form.phone.trim(),
      consultationHours: form.consultationHours.trim(),
      biography: form.biography.trim(),
      room: form.room.trim(),
      isOnline,
      notificationsEnabled,
    };
    onUpdateDoctor(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const field = (
    label: string,
    key: keyof typeof form,
    opts?: { placeholder?: string; icon?: React.ReactNode; readOnly?: boolean; textarea?: boolean }
  ) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {opts?.icon}
        {label}
      </label>
      {opts?.textarea ? (
        <textarea
          rows={3}
          value={form[key]}
          readOnly={opts?.readOnly}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium focus:outline-none transition-all resize-none leading-relaxed ${
            opts?.readOnly
              ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-default'
              : 'bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
          }`}
        />
      ) : (
        <input
          type="text"
          value={form[key]}
          readOnly={opts?.readOnly}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium focus:outline-none transition-all ${
            opts?.readOnly
              ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-default'
              : 'bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
          }`}
        />
      )}
    </div>
  );

  const toggle = (
    label: string,
    desc: string,
    value: boolean,
    onChange: (v: boolean) => void,
    accentColor = 'indigo'
  ) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
          value ? `bg-${accentColor}-500` : 'bg-slate-200'
        }`}
        style={{ backgroundColor: value ? (accentColor === 'emerald' ? '#10b981' : '#6366f1') : '#e2e8f0' }}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
            value ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex overflow-hidden"
      >
        {/* Left Sidebar Nav */}
        <div className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Settings size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white">Settings</p>
                <p className="text-[9px] text-slate-400 font-semibold">Doctor Console</p>
              </div>
            </div>

            {/* Doctor avatar + name */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-base">
                  {(activeDoctor?.name || doctorName).charAt(0)}
                </div>
                {/* Online dot */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{activeDoctor?.name || doctorName}</p>
                <p className={`text-[9px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isOnline ? '● Online' : '○ Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-1">
            {(Object.entries(SECTION_META) as [SettingsSection, typeof SECTION_META[SettingsSection]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                  activeSection === key
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{meta.label}</p>
                </div>
                {activeSection === key && <ChevronRight size={12} className="opacity-50" />}
              </button>
            ))}
          </nav>

          {/* HIPAA badge */}
          <div className="p-3 m-3 bg-slate-800/60 rounded-xl">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase mb-1">
              <Shield size={10} /> HIPAA Secure
            </div>
            <p className="text-[8px] text-slate-500 leading-relaxed">
              All settings are encrypted and stored securely.
            </p>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Section Header */}
          <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                {SECTION_META[activeSection].icon}
                <h2 className="text-lg font-black text-slate-900">{SECTION_META[activeSection].label}</h2>
              </div>
              <p className="text-xs text-slate-400 font-semibold">{SECTION_META[activeSection].desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-100"
                >
                  <CheckCircle size={12} /> Saved!
                </motion.span>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Section Body */}
          <div className="flex-1 overflow-y-auto p-7 space-y-5">

            {/* ===== PROFILE SECTION ===== */}
            {activeSection === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  {field('Full Name', 'name', { placeholder: 'Dr. Jane Smith', icon: <User size={11} /> })}
                  {field('Medical Specialty', 'specialty', { placeholder: 'Cardiology', icon: <Stethoscope size={11} /> })}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {field('Hospital / Clinic', 'hospital', { placeholder: 'City Medical Center', icon: <Building2 size={11} /> })}
                  {field('Office / Room', 'room', { placeholder: 'Suite 402', icon: <MapPin size={11} /> })}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {field('Phone Number', 'phone', { placeholder: '(555) 012-3456', icon: <Phone size={11} /> })}
                  {field('Email', 'name', { placeholder: doctorEmail, readOnly: true, icon: <Mail size={11} /> })}
                </div>
                {field('Clinical Biography', 'biography', {
                  placeholder: 'Describe your experience, specialty focus, or patient care philosophy...',
                  icon: <FileText size={11} />,
                  textarea: true,
                })}
              </motion.div>
            )}

            {/* ===== AVAILABILITY SECTION ===== */}
            {activeSection === 'availability' && (
              <motion.div
                key="availability"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Online/Offline hero toggle */}
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isOnline ? 'bg-emerald-100' : 'bg-slate-200'
                      }`}>
                        {isOnline
                          ? <Wifi size={28} className="text-emerald-600" />
                          : <WifiOff size={28} className="text-slate-400" />
                        }
                      </div>
                      <div>
                        <p className={`text-lg font-black ${isOnline ? 'text-emerald-800' : 'text-slate-600'}`}>
                          {isOnline ? 'You are Online' : 'You are Offline'}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {isOnline
                            ? 'Patients can see you as available and send messages'
                            : 'You appear as offline — new messages will be queued'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOnline(!isOnline)}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-inner ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md ${
                          isOnline ? 'left-9' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Consultation Hours */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Clock size={11} /> Consultation Hours
                  </label>
                  <input
                    type="text"
                    value={form.consultationHours}
                    onChange={e => setForm(p => ({ ...p, consultationHours: e.target.value }))}
                    placeholder="Mon–Fri 9:00 AM – 5:00 PM"
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Status options */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Online', desc: 'Fully available', color: 'bg-emerald-500', active: isOnline },
                    { label: 'Offline', desc: 'Not available', color: 'bg-slate-400', active: !isOnline },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setIsOnline(opt.label === 'Online')}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        opt.active
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${opt.color} mb-2`} />
                      <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                      {opt.active && <Check size={14} className="text-indigo-600 mt-1" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== NOTIFICATIONS SECTION ===== */}
            {activeSection === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-3"
              >
                <p className="text-xs text-slate-400 font-semibold pb-1">Control what alerts you receive in the Provider Console.</p>
                {toggle(
                  'All Notifications',
                  'Master switch for all alerts',
                  notificationsEnabled,
                  setNotificationsEnabled,
                  'indigo'
                )}
                <div className={`space-y-3 transition-all ${notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  {toggle(
                    'New Patient Messages',
                    'Alert when a patient sends you a message',
                    notifyNewMsg,
                    setNotifyNewMsg,
                    'emerald'
                  )}
                  {toggle(
                    'Connection Requests',
                    'Notify when a patient requests to connect',
                    notifyRequest,
                    setNotifyRequest,
                    'emerald'
                  )}
                  {toggle(
                    'Appointment Reminders',
                    'Scheduled appointment alerts',
                    notifyAppointment,
                    setNotifyAppointment,
                    'emerald'
                  )}
                </div>
              </motion.div>
            )}

            {/* ===== SECURITY SECTION ===== */}
            {activeSection === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* License info — read only */}
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
                    <Shield size={14} /> Verified Credentials
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">License Number</p>
                      <p className="text-sm font-bold text-slate-800">{activeDoctor?.licenseNumber || 'PENDING'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Verification Status</p>
                      <p className={`text-sm font-bold ${activeDoctor?.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {activeDoctor?.isVerified ? '✓ Verified' : '⏳ Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</p>
                      <p className="text-sm font-bold text-slate-800">{doctorEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Account Role</p>
                      <p className="text-sm font-bold text-indigo-600">Licensed Physician</p>
                    </div>
                  </div>
                </div>

                {field('License Number', 'licenseNumber', {
                  placeholder: 'MD-XXXXX',
                  icon: <Hash size={11} />,
                })}

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Credential Changes Require Admin Review</p>
                    <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                      Any changes to your license number or verification status must be reviewed by the system administrator. This ensures HIPAA compliance.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">Password & Authentication</p>
                  </div>
                  <p className="text-xs text-slate-400">Password changes are managed through your organization's identity provider. Contact your administrator for assistance.</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Save */}
          <div className="px-7 py-4 border-t border-slate-100 bg-white flex-shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-semibold">
              Changes are saved locally and synced when online.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!activeDoctor}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorSettings;
