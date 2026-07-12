import React, { useState } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  Search, 
  ShieldAlert, 
  Check, 
  Plus, 
  AlertCircle, 
  Clock, 
  BookOpen, 
  User, 
  Calendar, 
  FileText, 
  ClipboardList, 
  Send, 
  LogOut, 
  Key,
  ShieldCheck,
  Activity,
  ChevronRight,
  X,
  CheckCircle,
  Bell,
  Phone,
  MapPin,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';
import { checkMedicationSafety } from '../services/geminiService';
import { Medication, UserProfile, SafetyReport, DoctorAppointment, MedicalReport, Doctor, Conversation, ConnectionRequest } from '../types';
import { DoctorApprovalService, DoctorNotification } from '../services/doctorApprovalService';
import { MedicalReportIntegrationService } from '../services/medicalReportIntegrationService';
import DoctorMessagingPanel from './DoctorMessagingPanel';
import DoctorSettings from './DoctorSettings';

interface DoctorDashboardProps {
  doctorName: string;
  doctorEmail: string;
  activeDoctor: Doctor | null;
  onUpdateDoctor: (updated: Doctor) => void;
  onLogout: () => void;
  allPatients: UserProfile[];
  allMedications: Medication[];
  onAddMedicationToPatient: (med: Omit<Medication, 'id' | 'profileId'>, patientId: string) => void;
  onLogAudit: (action: string, details: string) => void;
  appointments: DoctorAppointment[];
  onUpdateAppointmentStatus: (id: string, status: 'completed' | 'cancelled') => void;
  medicalReports?: MedicalReport[];
  onLinkReportToAppointment?: (appointmentId: string, reportId: string) => void;
  onShareReportWithPatient?: (reportId: string) => void;
  // Messaging
  conversations?: Conversation[];
  connectionRequests?: ConnectionRequest[];
  onAcceptConnectionRequest?: (requestId: string) => void;
  onDeclineConnectionRequest?: (requestId: string) => void;
  onSendMessage?: (conversationId: string, content: string) => void;
  onConversationsChange?: (convs: Conversation[]) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorName,
  doctorEmail,
  activeDoctor,
  onUpdateDoctor,
  onLogout,
  allPatients,
  allMedications,
  onAddMedicationToPatient,
  onLogAudit,
  appointments = [],
  onUpdateAppointmentStatus,
  medicalReports = [],
  onLinkReportToAppointment,
  onShareReportWithPatient,
  conversations = [],
  connectionRequests = [],
  onAcceptConnectionRequest,
  onDeclineConnectionRequest,
  onSendMessage,
  onConversationsChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<UserProfile | null>(null);

  // Settings & Online/Offline state
  const [showSettings, setShowSettings] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(activeDoctor?.isOnline ?? true);

  // Secure report viewing states
  const [selectedReportToView, setSelectedReportToView] = useState<MedicalReport | null>(null);
  const [activeAppointmentForView, setActiveAppointmentForView] = useState<DoctorAppointment | null>(null);
  const [loadingPHI, setLoadingPHI] = useState(false);
  const [phiError, setPhiError] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState<DoctorNotification[]>(() => 
    DoctorApprovalService.getNotifications(doctorEmail)
  );
  const [showNotifications, setShowNotifications] = useState(false);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      DoctorApprovalService.markAsRead(doctorEmail);
      setNotifications(DoctorApprovalService.getNotifications(doctorEmail));
    }
  };

  const handleClearNotifications = () => {
    DoctorApprovalService.clearNotifications(doctorEmail);
    setNotifications([]);
  };

  // Doctor Profile Edit/View states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    specialty: '',
    hospital: '',
    licenseNumber: '',
    phone: '',
    consultationHours: '',
    biography: '',
    room: ''
  });

  const handleOpenProfileModal = () => {
    if (activeDoctor) {
      setProfileFormData({
        name: activeDoctor.name || '',
        specialty: activeDoctor.specialty || '',
        hospital: activeDoctor.hospital || '',
        licenseNumber: activeDoctor.licenseNumber || '',
        phone: activeDoctor.phone || '',
        consultationHours: activeDoctor.consultationHours || 'Mon-Fri 9:00 AM - 5:00 PM',
        biography: activeDoctor.biography || '',
        room: activeDoctor.room || 'Suite 402'
      });
    } else {
      setProfileFormData({
        name: doctorName,
        specialty: 'Licensed Physician',
        hospital: 'General Clinic',
        licenseNumber: 'PENDING',
        phone: '',
        consultationHours: 'Mon-Fri 9:00 AM - 5:00 PM',
        biography: '',
        room: 'Suite 402'
      });
    }
    setShowProfileModal(true);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctor) return;
    const updated: Doctor = {
      ...activeDoctor,
      name: profileFormData.name,
      specialty: profileFormData.specialty,
      hospital: profileFormData.hospital,
      licenseNumber: profileFormData.licenseNumber,
      phone: profileFormData.phone,
      consultationHours: profileFormData.consultationHours,
      biography: profileFormData.biography,
      room: profileFormData.room
    };
    onUpdateDoctor(updated);
    setIsEditingProfile(false);
  };

  const handleAccessReportSecurely = async (appointment: DoctorAppointment) => {
    setLoadingPHI(true);
    setPhiError('');
    setActiveAppointmentForView(appointment);
    try {
      const report = await MedicalReportIntegrationService.getAppointmentReportSecure(
        appointment.id,
        doctorEmail, // viewerId
        'doctor',    // viewerRole
        doctorEmail, // viewerEmail
        doctorName,  // activeDoctorName
        onLogAudit
      );
      if (report) {
        setSelectedReportToView(report);
      } else {
        setPhiError('No medical report linked to this appointment.');
      }
    } catch (err: any) {
      setPhiError(err.message || 'Failed to securely fetch Protected Health Information (PHI).');
    } finally {
      setLoadingPHI(false);
    }
  };
  
  // Consent OTP simulator state
  const [isRequestingConsent, setIsRequestingConsent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [consentUnlocked, setConsentUnlocked] = useState<string | null>(null); // patientId if unlocked
  const [consentError, setConsentError] = useState('');

  // Prescription builder state
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'Once Daily',
    instructions: '',
    remaining: 30,
    lowStockThreshold: 5
  });
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null);
  const [prescriptionSuccess, setPrescriptionSuccess] = useState(false);

  // Consult Notes state
  const [consultNotes, setConsultNotes] = useState('');
  const [noteLogs, setNoteLogs] = useState<{ date: string; note: string }[]>([]);

  // Filtered patient list
  const filteredPatients = allPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRequestConsent = (patient: UserProfile) => {
    setIsRequestingConsent(true);
    setOtpCode('');
    setConsentError('');
    onLogAudit('OTP Consent Request Issued', `Requested records access OTP for patient email: ${patient.email}`);
  };

  const handleVerifyOtp = (e: React.FormEvent, patient: UserProfile) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      setConsentUnlocked(patient.id);
      setIsRequestingConsent(false);
      setSelectedPatient(patient);
      setSafetyReport(null);
      setPrescriptionSuccess(false);
      onLogAudit('OTP Consent Verified Successfully', `Provider unlocked medical record file for patient ID: ${patient.id} (HIPAA Compliant)`);
    } else {
      setConsentError('Please enter a valid 6-digit medical consent code.');
    }
  };

  // Run Safety Pre-check for the candidate medication
  const runPrePrescribingSafetyCheck = async () => {
    if (!selectedPatient || !newMed.name) return;
    setCheckingSafety(true);
    setSafetyReport(null);
    onLogAudit('AI Safety Pre-Check Started', `Initiated interaction analysis for candidate drug: ${newMed.name} on Patient: ${selectedPatient.id}`);
    
    try {
      // Get the patient's existing meds
      const patientMeds = allMedications.filter(m => m.profileId === selectedPatient.id);
      const report = await checkMedicationSafety(patientMeds, newMed.name, selectedPatient);
      setSafetyReport(report);
      onLogAudit('AI Safety Pre-Check Completed', `Analysis output overall severity level: ${report.overallSeverity} for drug: ${newMed.name}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingSafety(false);
    }
  };

  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newMed.name || !newMed.dosage) return;

    const formattedMed = {
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      instructions: newMed.instructions || 'Take as directed by doctor',
      remaining: Number(newMed.remaining),
      lowStockThreshold: Number(newMed.lowStockThreshold),
      reminders: [
        { id: Math.random().toString(36).substr(2, 9), time: '09:00', enabled: true }
      ]
    };

    onAddMedicationToPatient(formattedMed, selectedPatient.id);
    setPrescriptionSuccess(true);
    onLogAudit('Prescription Issued', `Doctor issued ${newMed.name} (${newMed.dosage}) to patient: ${selectedPatient.id}`);

    // Reset prescriber state
    setNewMed({
      name: '',
      dosage: '',
      frequency: 'Once Daily',
      instructions: '',
      remaining: 30,
      lowStockThreshold: 5
    });
    setSafetyReport(null);
    setTimeout(() => setPrescriptionSuccess(false), 5000);
  };

  const handleSaveConsultNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultNotes.trim()) return;
    const newNote = {
      date: new Date().toLocaleString(),
      note: consultNotes
    };
    setNoteLogs([newNote, ...noteLogs]);
    setConsultNotes('');
    onLogAudit('Consultation Note Saved', `Saved clinical notes for patient ID: ${selectedPatient?.id}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Top Banner */}
      <div className="bg-indigo-900 text-white py-1.5 px-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
        <span className="flex items-center gap-1.5"><Key size={12} className="text-indigo-400" /> Authorized Provider Portal</span>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            {isOnline ? 'Available' : 'Offline Mode'}
          </span>
          <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded text-[9px]">HIPAA Compliant</span>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 py-5 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md text-white">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Provider Console</h1>
            <p className="text-xs text-slate-400 font-bold">Healthcare AI Safety Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleOpenProfileModal}
            className="text-right hover:bg-slate-50 p-1.5 rounded-xl transition-all cursor-pointer group"
            title="View & Edit Professional Profile"
          >
            <p className="text-sm font-black text-slate-900 group-hover:text-indigo-650 transition-colors">{doctorName}</p>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center justify-end gap-1">
              <span>Licensed Physician</span>
              <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
            </p>
          </button>

          <button 
            onClick={handleOpenProfileModal}
            className="p-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-100 active:scale-95 flex items-center justify-center shadow-sm"
            title="View & Edit Professional Profile"
          >
            <User size={16} />
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button 
              onClick={handleToggleNotifications}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200 active:scale-95 flex items-center justify-center shadow-sm"
              title="Notifications"
            >
              <Bell size={16} />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Bell size={14} className="text-indigo-600" /> Notifications
                  </h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearNotifications}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-red-500 transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-bold">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all ${
                          n.type === 'approval' 
                            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                            : n.type === 'rejection' 
                            ? 'bg-red-50/70 border-red-100 text-red-800' 
                            : 'bg-slate-50 border-slate-150 text-slate-700'
                        }`}
                      >
                        <div className="font-semibold">{n.message}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                          <Clock size={10} /> {n.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Online / Offline Toggle Pill */}
          <button
            onClick={() => {
              const newStatus = !isOnline;
              setIsOnline(newStatus);
              if (activeDoctor) {
                onUpdateDoctor({ ...activeDoctor, isOnline: newStatus });
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all border active:scale-95 shadow-sm ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Online / Offline availability"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-100 active:scale-95 flex items-center justify-center shadow-sm"
            title="Doctor Settings"
          >
            <Settings size={16} />
          </button>

          {!showLogoutConfirm ? (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-200 hover:border-red-100 shadow-sm active:scale-95"
              title="Sign Out & Switch Users"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-1.5 shadow-sm animate-fadeIn">
              <span className="text-[10px] font-black text-red-600 px-1">Exit Provider Console?</span>
              <button
                onClick={onLogout}
                className="py-1 px-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-[10px] font-black transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black transition-all"
              >
                No
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Doctor Settings Modal */}
      {showSettings && (
        <DoctorSettings
          activeDoctor={activeDoctor}
          doctorEmail={doctorEmail}
          doctorName={doctorName}
          onUpdateDoctor={(updated) => {
            onUpdateDoctor(updated);
            setIsOnline(updated.isOnline ?? true);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Patient Directory */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Patient Directory</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search patient name or email..."
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Patients List */}
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto scrollbar-hide">
              {filteredPatients.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  No matching patients found.
                </div>
              ) : (
                filteredPatients.map(p => {
                  const isUnlocked = consentUnlocked === p.id;
                  const isCurrentlySelected = selectedPatient?.id === p.id;
                  
                  return (
                    <div 
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isCurrentlySelected 
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        if (isUnlocked) {
                          setSelectedPatient(p);
                          setSafetyReport(null);
                          setPrescriptionSuccess(false);
                        } else {
                          handleRequestConsent(p);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{p.email}</p>
                          </div>
                        </div>
                        {isUnlocked ? (
                          <span className="p-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg" title="Access Unlocked">
                            <ShieldCheck size={14} />
                          </span>
                        ) : (
                          <span className="p-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg" title="Requires OTP Consent">
                            <Key size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* OTP Verification Modal Inside Sidebar */}
          {isRequestingConsent && (
            <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 shadow-sm space-y-4 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="font-black text-amber-900 text-sm">Requires Verification Code</h4>
                  <p className="text-[10px] text-amber-700 font-semibold leading-relaxed mt-1">
                    Please request the 6-digit medical consent OTP from the patient to unlock HIPAA-ready health records access.
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => {
                const patient = filteredPatients.find(p => !consentUnlocked || consentUnlocked !== p.id);
                if (patient) handleVerifyOtp(e, patient);
              }} className="space-y-3">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Enter 6-digit code (e.g., 123456)"
                  className="w-full bg-white border border-amber-300 text-center py-2.5 rounded-xl font-bold tracking-widest text-sm outline-none focus:border-amber-500 text-slate-800 transition-all"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
                {consentError && <p className="text-[10px] text-red-600 font-bold">{consentError}</p>}
                
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsRequestingConsent(false)}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg shadow-md"
                  >
                    Verify & Unlock
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Record Viewer / Prescriber */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedPatient.name}</h2>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md">Consent Active</span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{selectedPatient.email} • Age: {selectedPatient.age || 'Not specified'} • Weight: {selectedPatient.weight || 'Not specified'}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedPatient.allergies && selectedPatient.allergies.map((a, idx) => (
                        <span key={idx} className="bg-red-50 border border-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Allergic: {a}</span>
                      ))}
                      {selectedPatient.chronicConditions && selectedPatient.chronicConditions.map((c, idx) => (
                        <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{c}</span>
                      ))}
                      {selectedPatient.isPregnancy && (
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Pregnancy Alert</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Blood Type</span>
                    <p className="text-sm font-black text-slate-800">{selectedPatient.bloodType || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total Meds</span>
                    <p className="text-sm font-black text-slate-800">
                      {allMedications.filter(m => m.profileId === selectedPatient.id).length} Active
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid: Active Medications and Adherence Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Meds Card */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Activity size={16} className="text-indigo-600" />
                    Active Medications
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                    {allMedications.filter(m => m.profileId === selectedPatient.id).length === 0 ? (
                      <div className="py-12 text-center text-xs font-bold text-slate-400">
                        No active medications reported.
                      </div>
                    ) : (
                      allMedications.filter(m => m.profileId === selectedPatient.id).map(m => (
                        <div key={m.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                          <h4 className="font-extrabold text-xs text-slate-800">{m.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{m.dosage} • {m.frequency}</p>
                          <p className="text-[9px] text-slate-500 mt-1 leading-relaxed italic">Instructions: {m.instructions}</p>
                          <div className="mt-2 text-[9px] font-bold text-slate-400 flex justify-between items-center">
                            <span>Inventory: {m.remaining} left</span>
                            <span className={m.remaining <= (m.lowStockThreshold || 5) ? "text-amber-500 animate-pulse font-black uppercase" : ""}>
                              {m.remaining <= (m.lowStockThreshold || 5) ? 'Low Stock' : 'Stock OK'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Patient Consultation & Log Session Notes */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <ClipboardList size={16} className="text-indigo-600" />
                    Consultation Journal
                  </h3>

                  <form onSubmit={handleSaveConsultNote} className="space-y-3">
                    <textarea 
                      placeholder="Type side effects log, treatment changes, or caregiver guidance notes..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
                      value={consultNotes}
                      onChange={e => setConsultNotes(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!consultNotes.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Send size={12} /> Log Clinical Note
                    </button>
                  </form>

                  {/* Note Logs History */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide">
                    {noteLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-indigo-50/10 border border-indigo-100 rounded-xl space-y-1">
                        <span className="text-[8px] font-black text-slate-400">{log.date}</span>
                        <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">{log.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shared Patient Medical Reports Panel */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  <h3 className="font-black text-slate-900 text-sm">Shared Patient Medical Reports</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  Below are the clinical diagnostic records and lab panels stored securely in this patient's account, shared under HIPAA compliance.
                </p>

                {medicalReports.filter(r => r.patientId === selectedPatient.id).length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                    No medical reports have been uploaded or shared by this patient yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                    {medicalReports
                      .filter(r => r.patientId === selectedPatient.id)
                      .map((report) => (
                        <div key={report.id} className="p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-200/60 rounded-2xl space-y-3 transition-all flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{report.title}</h4>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">Date: {report.date}</p>
                              </div>
                              {report.attachmentName && (
                                <span className="shrink-0 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black border border-blue-100 uppercase tracking-wider">
                                  {report.attachmentName}
                                </span>
                              )}
                            </div>

                            {report.reportText && (
                              <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 leading-relaxed font-semibold italic">
                                "{report.reportText}"
                              </p>
                            )}

                            {report.findings && (
                              <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl">
                                <span className="text-[9px] font-black uppercase text-emerald-600 block mb-0.5">Clinical Summary</span>
                                {report.findings}
                              </div>
                            )}
                          </div>

                          {report.extractedMedications && report.extractedMedications.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-slate-200/50">
                              <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Detected Meds:</span>
                              {report.extractedMedications.map((mName, idx) => (
                                <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {mName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Prescription Builder with Core AI Safety Engine Check */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <Plus size={20} className="text-indigo-600" />
                    Prescription Creator & Safety Analyzer
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Draft medications and run real-time safety screenings against the patient's existing drugs and allergies.</p>
                </div>

                <form onSubmit={handleIssuePrescription} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Medication Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Lisinopril, Simvastatin"
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold transition-all"
                        value={newMed.name}
                        onChange={e => setNewMed({...newMed, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dosage</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 10mg, 400mg"
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold transition-all"
                        value={newMed.dosage}
                        onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Frequency</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold transition-all"
                        value={newMed.frequency}
                        onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                      >
                        <option>Once Daily</option>
                        <option>Twice Daily</option>
                        <option>Three Times Daily</option>
                        <option>Four Times Daily</option>
                        <option>As Needed (PRN)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Initial Supply Quantity</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold transition-all"
                        value={newMed.remaining}
                        onChange={e => setNewMed({...newMed, remaining: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Low Stock Trigger</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold transition-all"
                        value={newMed.lowStockThreshold}
                        onChange={e => setNewMed({...newMed, lowStockThreshold: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clinical Instructions</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Take with water in the morning, do not crush"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold transition-all"
                      value={newMed.instructions}
                      onChange={e => setNewMed({...newMed, instructions: e.target.value})}
                    />
                  </div>

                  {/* Action Row */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={runPrePrescribingSafetyCheck}
                      disabled={checkingSafety || !newMed.name}
                      className="flex-1 py-3 bg-indigo-50 border border-indigo-100 text-indigo-600 font-extrabold text-xs rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {checkingSafety ? 'Querying Safety Catalogs...' : 'Run Safety Pre-Check'}
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all"
                    >
                      Issue & Save Prescription
                    </button>
                  </div>
                </form>

                {prescriptionSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    Prescription successfully added to patient file, synced to database, and audit logs recorded.
                  </div>
                )}

                {/* Pre-Check Report Output */}
                {safetyReport && (
                  <div className="p-5 bg-slate-900 text-white border border-slate-800 rounded-3xl space-y-4 animate-in slide-in-from-top-3 duration-200">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-extrabold text-sm flex items-center gap-2 text-white">
                          <ShieldAlert size={16} className={safetyReport.overallSeverity === 'safe' ? 'text-green-500' : 'text-amber-500'} />
                          AI Prescribing Screening Summary
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">
                          {safetyReport.summary}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        safetyReport.overallSeverity === 'safe' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        safetyReport.overallSeverity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {safetyReport.overallSeverity} warning
                      </span>
                    </div>

                    {safetyReport.findings.length > 0 ? (
                      <div className="space-y-3.5 border-t border-slate-800 pt-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                        {safetyReport.findings.map((f, idx) => (
                          <div key={idx} className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black">
                              <span className="text-amber-400 uppercase tracking-widest">{f.type}</span>
                              <span className="text-slate-400">{f.severity} severity</span>
                            </div>
                            <h5 className="font-bold text-xs text-white leading-snug">{f.title}</h5>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                              {f.explanation}
                            </p>
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400 italic">
                              <span className="font-bold uppercase text-blue-400 not-italic mr-1.5">Actionable Advice:</span>
                              {f.recommendation}
                            </div>
                            <div className="text-[9px] text-slate-500 font-extrabold flex items-center gap-1.5">
                              <BookOpen size={10} />
                              Source Citation: {f.reference}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 font-bold bg-slate-800/30 rounded-xl border border-dashed border-slate-700/60 text-xs">
                        No active drug-interaction, allergy, or disease contraindications matched! This prescription appears clinical-grade safe.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Doctor Schedule Welcome Banner */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-850 p-8 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">Structured Consults Planner</h3>
                  <p className="text-xs text-indigo-200 font-bold max-w-xl leading-relaxed">
                    Welcome to your patient appointments hub. Below are the scheduled clinical sessions booked by patients through their personal companion portal.
                  </p>
                </div>
              </div>

              {/* Active Scheduled Appointments */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-600" />
                    Structured Patient Appointments
                  </h4>
                  <span className="bg-indigo-50 text-indigo-600 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                    {appointments.filter(app => app.doctorName.toLowerCase() === doctorName.toLowerCase() && app.status === 'scheduled').length} Pending
                  </span>
                </div>

                {appointments.filter(app => app.doctorName.toLowerCase() === doctorName.toLowerCase() && app.status === 'scheduled').length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/40 space-y-3">
                    <Calendar size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-400">No scheduled consultations for {doctorName} today.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments
                      .filter(app => app.doctorName.toLowerCase() === doctorName.toLowerCase() && app.status === 'scheduled')
                      .map((app) => {
                        const matchedPatient = allPatients.find(p => p.email.toLowerCase() === app.patientEmail.toLowerCase() || p.id === app.patientId);
                        const isUnlocked = consentUnlocked === matchedPatient?.id;
                        const matchedReport = medicalReports.find(r => r.id === app.medicalReportId);

                        return (
                          <div 
                            key={app.id} 
                            className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200/60 p-5 rounded-3xl transition-all hover:shadow-sm space-y-4 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h5 className="font-extrabold text-slate-900 text-sm">{app.patientName}</h5>
                                  <p className="text-[10px] text-slate-400 font-semibold">{app.patientEmail}</p>
                                </div>
                                <span className="bg-indigo-50 text-indigo-600 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                                  {app.time}
                                </span>
                              </div>
                              
                              <p className="text-[11px] text-slate-600 font-medium bg-white p-2.5 rounded-xl border border-slate-100 italic leading-relaxed">
                                "{app.reason}"
                              </p>

                              {matchedReport ? (
                                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-700 uppercase tracking-wider">
                                      <FileText size={11} /> Attached Medical Report
                                    </div>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                      matchedReport.doctorName ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {matchedReport.doctorName ? 'Shared with Patient' : 'Internal Use'}
                                    </span>
                                  </div>
                                  <h6 className="font-bold text-[11px] text-slate-950 leading-tight">{matchedReport.title}</h6>
                                  {matchedReport.findings && (
                                    <p className="text-[10px] text-slate-500 font-bold truncate">Findings: {matchedReport.findings}</p>
                                  )}
                                  
                                  {/* Action options for medical report inside appointment */}
                                  <div className="flex flex-col sm:flex-row gap-1.5 pt-1.5 border-t border-indigo-100/60 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAccessReportSecurely(app)}
                                      className="flex-1 py-1.5 px-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wide transition-all shadow-sm"
                                    >
                                      🔒 Access PHI Report (Secure)
                                    </button>
                                    {!matchedReport.doctorName && onShareReportWithPatient && (
                                      <button
                                        type="button"
                                        onClick={() => onShareReportWithPatient(matchedReport.id)}
                                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wide transition-all shadow-sm"
                                      >
                                        📤 Share Report
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-2xl space-y-2">
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                    No Attached Medical Report
                                  </div>
                                  {isUnlocked ? (
                                    <div className="space-y-1.5">
                                      <p className="text-[9px] text-slate-400 font-bold">Select a report to link to this session:</p>
                                      <select
                                        onChange={(e) => {
                                          if (e.target.value && onLinkReportToAppointment) {
                                            onLinkReportToAppointment(app.id, e.target.value);
                                          }
                                        }}
                                        defaultValue=""
                                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      >
                                        <option value="" disabled>-- Link Report --</option>
                                        {medicalReports
                                          .filter(r => r.patientId === matchedPatient?.id)
                                          .map(r => (
                                            <option key={r.id} value={r.id}>{r.title} ({r.date})</option>
                                          ))
                                        }
                                        {medicalReports.filter(r => r.patientId === matchedPatient?.id).length === 0 && (
                                          <option disabled>No reports uploaded by patient</option>
                                        )}
                                      </select>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                                      Verify patient consent OTP to link or securely view clinical medical reports for this session.
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 pt-1">
                                <Calendar size={12} />
                                Schedule: {app.date}
                              </div>
                            </div>

                            {/* Actions Row */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                              <button
                                onClick={() => {
                                  if (matchedPatient) {
                                    if (isUnlocked) {
                                      setSelectedPatient(matchedPatient);
                                    } else {
                                      handleRequestConsent(matchedPatient);
                                    }
                                  }
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase text-center transition-all ${
                                  isUnlocked 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                }`}
                              >
                                {isUnlocked ? 'Open Patient File' : 'Verify Consent & Open'}
                              </button>
                              
                              <button
                                onClick={() => onUpdateAppointmentStatus(app.id, 'completed')}
                                className="p-1.5 bg-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors"
                                title="Mark Consult Completed"
                              >
                                <Check size={14} strokeWidth={2.5} />
                              </button>
                              
                              <button
                                onClick={() => onUpdateAppointmentStatus(app.id, 'cancelled')}
                                className="p-1.5 bg-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg transition-colors"
                                title="Cancel Consult"
                              >
                                <X size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Consultation History */}
              {appointments.filter(app => app.doctorName.toLowerCase() === doctorName.toLowerCase() && app.status !== 'scheduled').length > 0 && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    Structured Consultation Logs History
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-hide">
                    {appointments
                      .filter(app => app.doctorName.toLowerCase() === doctorName.toLowerCase() && app.status !== 'scheduled')
                      .map((app) => (
                        <div key={app.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-extrabold text-slate-800">{app.patientName} ({app.patientEmail})</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Scheduled on {app.date} at {app.time} • Reason: {app.reason}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* =========== MESSAGES SECTION =========== */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-emerald-400 rounded-full" />
          <div>
            <h2 className="text-xl font-black text-slate-900">Patient Messaging</h2>
            <p className="text-xs text-slate-400 font-semibold">Secure HIPAA-compliant direct messaging with patients</p>
          </div>
          {connectionRequests.filter(r => r.doctorEmail === doctorEmail && r.status === 'pending').length > 0 && (
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-xl border border-amber-200 animate-pulse">
              {connectionRequests.filter(r => r.doctorEmail === doctorEmail && r.status === 'pending').length} Pending Request(s)
            </span>
          )}
        </div>
        <DoctorMessagingPanel
          doctorId={activeDoctor?.id || 'doc-unknown'}
          doctorName={doctorName}
          doctorEmail={doctorEmail}
          allPatients={allPatients}
          conversations={conversations}
          connectionRequests={connectionRequests}
          onAcceptRequest={(reqId) => onAcceptConnectionRequest?.(reqId)}
          onDeclineRequest={(reqId) => onDeclineConnectionRequest?.(reqId)}
          onSendMessage={(convId, content) => onSendMessage?.(convId, content)}
          onConversationsChange={(convs) => onConversationsChange?.(convs)}
        />
      </section>

      {/* HIPAA SECURE REPORT DETAILS DIALOG */}
      {(selectedReportToView || loadingPHI || phiError) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-[9px] uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-indigo-600 animate-pulse" /> HIPAA SECURE PHI ACCESS PORTAL
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {selectedReportToView ? selectedReportToView.title : 'Decrypting PHI Data...'}
                </h3>
                {selectedReportToView && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    Patient ID: {selectedReportToView.patientId} • Date Created: {new Date(selectedReportToView.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button 
                onClick={() => {
                  setSelectedReportToView(null);
                  setActiveAppointmentForView(null);
                  setPhiError('');
                }}
                className="p-1.5 bg-slate-150 hover:bg-slate-200 rounded-full transition-all text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {loadingPHI ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider animate-pulse">Running HIPAA decryption & access credential checks...</p>
                </div>
              ) : phiError ? (
                <div className="py-12 text-center space-y-4">
                  <ShieldAlert size={48} className="text-red-500 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-950">HIPAA Security Policy Exception</h4>
                    <p className="text-xs text-red-600 font-semibold max-w-md mx-auto leading-relaxed">{phiError}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">This event has been flagged and recorded in the system audit logs.</p>
                </div>
              ) : selectedReportToView ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Findings */}
                  {selectedReportToView.findings && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Clinical Summary & Findings</span>
                      <p className="text-xs text-emerald-950 font-semibold leading-relaxed">
                        {selectedReportToView.findings}
                      </p>
                    </div>
                  )}

                  {/* Detected Medications */}
                  {selectedReportToView.extractedMedications && selectedReportToView.extractedMedications.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Clinical Medications Extracted</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedReportToView.extractedMedications.map((med, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl uppercase">
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OCR Full Text */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Full OCR Diagnostic Content</span>
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl max-h-[220px] overflow-y-auto font-mono text-[11px] text-slate-650 leading-relaxed whitespace-pre-wrap">
                      {selectedReportToView.reportText}
                    </div>
                  </div>

                  {/* HIPAA compliance label */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-450">
                      Signature Doctor: {selectedReportToView.doctorName || 'Not yet signed / Shared by Patient'}
                    </div>
                    {selectedReportToView.attachmentName && (
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-500">
                        File: {selectedReportToView.attachmentName}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> SECURE AUDIT LOGGED
              </div>
              <button
                onClick={() => {
                  setSelectedReportToView(null);
                  setActiveAppointmentForView(null);
                  setPhiError('');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
              >
                Close Portal View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Professional Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="relative p-6 md:p-8 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black border border-white/20">
                  {profileFormData.name ? profileFormData.name.replace(/Dr\.\s+/i, '').charAt(0) : 'D'}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{profileFormData.name || 'Dr. Practitioner'}</h3>
                  <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full uppercase border border-emerald-500/30">
                    <ShieldCheck size={12} /> Verified Clinician
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/85"
                title="Close Profile"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
              {!isEditingProfile ? (
                // VIEW MODE
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Credentials / Core Info Card */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                      <Stethoscope size={12} /> Professional Credentials
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Specialty Field</span>
                        <p className="text-slate-800 font-extrabold text-sm">{profileFormData.specialty || 'General Practitioner'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Medical License ID</span>
                        <p className="text-slate-800 font-mono font-extrabold text-sm">{profileFormData.licenseNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Affiliated Health System</span>
                        <p className="text-slate-800 font-extrabold text-sm">{profileFormData.hospital || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Office / Room Suite</span>
                        <p className="text-slate-800 font-extrabold text-sm">{profileFormData.room || 'Suite 402'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Consultation / Practice Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 border border-slate-100 rounded-2xl space-y-2 flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-indigo-600 rounded-xl">
                        <Clock size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Clinical Hours</span>
                        <p className="text-xs text-slate-800 font-extrabold">{profileFormData.consultationHours || 'Mon-Fri 9:00 AM - 5:00 PM'}</p>
                      </div>
                    </div>

                    <div className="p-5 border border-slate-100 rounded-2xl space-y-2 flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-indigo-600 rounded-xl">
                        <Phone size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Clinic Contact Line</span>
                        <p className="text-xs text-slate-800 font-extrabold">{profileFormData.phone || 'No phone listed'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Biography / Statement */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen size={12} /> Clinical Profile & Biography
                    </h4>
                    <p className="text-xs text-slate-650 leading-relaxed font-semibold bg-indigo-50/20 border border-indigo-100/30 p-5 rounded-2xl whitespace-pre-line">
                      {profileFormData.biography || 'No professional biography provided yet. Edit your profile to add your medical background, education, or clinical interests.'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      <User size={14} /> Edit Profile Details
                    </button>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <form onSubmit={handleSaveProfile} className="space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Practitioner Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileFormData.name}
                        onChange={e => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800"
                        placeholder="Dr. Full Name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Specialty</label>
                      <input 
                        type="text" 
                        required
                        value={profileFormData.specialty}
                        onChange={e => setProfileFormData({ ...profileFormData, specialty: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800"
                        placeholder="e.g., Cardiology, Internal Medicine"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Affiliated Hospital</label>
                      <input 
                        type="text" 
                        required
                        value={profileFormData.hospital}
                        onChange={e => setProfileFormData({ ...profileFormData, hospital: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800"
                        placeholder="e.g., Johns Hopkins Hospital"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Number</label>
                      <input 
                        type="text" 
                        required
                        value={profileFormData.licenseNumber}
                        onChange={e => setProfileFormData({ ...profileFormData, licenseNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-mono font-semibold text-xs text-slate-800"
                        placeholder="e.g., MD-83204"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Suite / Consultation Room</label>
                      <input 
                        type="text" 
                        value={profileFormData.room}
                        onChange={e => setProfileFormData({ ...profileFormData, room: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800"
                        placeholder="e.g., Suite 402"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Contact Line</label>
                      <input 
                        type="text" 
                        value={profileFormData.phone}
                        onChange={e => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800"
                        placeholder="e.g., (555) 019-2834"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Practice Hours</label>
                    <input 
                      type="text" 
                      value={profileFormData.consultationHours}
                      onChange={e => setProfileFormData({ ...profileFormData, consultationHours: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800"
                      placeholder="e.g., Mon-Fri 9:00 AM - 5:00 PM"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Biography / Practice Focus</label>
                    <textarea 
                      rows={3}
                      value={profileFormData.biography}
                      onChange={e => setProfileFormData({ ...profileFormData, biography: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-semibold text-xs text-slate-800 leading-relaxed resize-none"
                      placeholder="Describe your medical experience, specialty training, or patient care philosophy..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Check size={14} /> Save Credentials
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
