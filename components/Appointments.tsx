import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  Activity, 
  Clipboard, 
  Sparkles, 
  CheckCircle, 
  ChevronRight,
  MapPin,
  FileText,
  Trash2,
  UploadCloud,
  Paperclip,
  FolderHeart,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { DoctorAppointment, UserProfile, MedicalReport } from '../types';
import { MedicalReportIntegrationService } from '../services/medicalReportIntegrationService';

interface AppointmentsProps {
  appointments: DoctorAppointment[];
  userProfile: UserProfile | null;
  onAddAppointment: (appointment: Omit<DoctorAppointment, 'id'>) => void;
  onCancelAppointment: (id: string) => void;
  medicalReports?: MedicalReport[];
  onAddMedicalReport?: (report: Omit<MedicalReport, 'id' | 'createdAt' | 'patientId'>) => void;
  onDeleteMedicalReport?: (id: string) => void;
  onLogAudit?: (action: string, details: string) => void;
}

const AVAILABLE_DOCTORS = [
  { name: 'Dr. Elizabeth Blackwell', specialty: 'Cardiology', hospital: 'St. Jude Health Center', room: 'Suite 402' },
  { name: 'Dr. Alexander Fleming', specialty: 'Endocrinology & General Practice', hospital: 'Metro General Hospital', room: 'Clinic 2B' },
  { name: 'Dr. Jonas Salk', specialty: 'Immunology & Infectious Diseases', hospital: 'Salk Medical Pavilion', room: 'Room 105' },
  { name: 'Dr. Virginia Apgar', specialty: 'Pediatrics & Family Medicine', hospital: 'Grace Womens & Childrens', room: 'Floor 3' }
];

const Appointments: React.FC<AppointmentsProps> = ({
  appointments = [],
  userProfile,
  onAddAppointment,
  onCancelAppointment,
  medicalReports = [],
  onAddMedicalReport,
  onDeleteMedicalReport,
  onLogAudit
}) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(AVAILABLE_DOCTORS[0]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [visitReason, setVisitReason] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Secure report viewing states
  const [selectedReportToView, setSelectedReportToView] = useState<MedicalReport | null>(null);
  const [loadingPHI, setLoadingPHI] = useState(false);
  const [phiError, setPhiError] = useState('');

  const handleAccessReportSecurely = async (appointment: DoctorAppointment) => {
    setLoadingPHI(true);
    setPhiError('');
    try {
      const email = userProfile?.email || 'anonymous';
      const patientId = userProfile?.id || 'patient-id';
      
      const report = await MedicalReportIntegrationService.getAppointmentReportSecure(
        appointment.id,
        patientId,
        'patient',
        email,
        undefined, // activeDoctorName is undefined on patient side
        onLogAudit || (() => {})
      );
      if (report) {
        setSelectedReportToView(report);
      } else {
        setPhiError('No medical report linked to this appointment.');
      }
    } catch (err: any) {
      setPhiError(err.message || 'Failed to securely fetch Protected Health Information.');
    } finally {
      setLoadingPHI(false);
    }
  };

  // Selected report to share with doctor
  const [selectedReportId, setSelectedReportId] = useState('');

  // Medical report creation states
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportText, setReportText] = useState('');
  const [reportFindings, setReportFindings] = useState('');
  const [reportMeds, setReportMeds] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Filtered appointments scoped to the current user profile
  const patientAppointments = appointments.filter(
    app => app.patientId === userProfile?.id
  );

  // Scheduled / upcoming vs. Completed/Cancelled
  const upcomingAppointments = patientAppointments
    .filter(app => app.status === 'scheduled')
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const pastAppointments = patientAppointments
    .filter(app => app.status !== 'scheduled')
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate || !appointmentTime || !userProfile) return;

    onAddAppointment({
      patientId: userProfile.id,
      patientName: userProfile.name,
      patientEmail: userProfile.email,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      date: appointmentDate,
      time: appointmentTime,
      reason: visitReason || 'Routine health examination',
      status: 'scheduled',
      medicalReportId: selectedReportId || undefined
    });

    setBookingSuccess(true);
    setVisitReason('');
    setAppointmentDate('');
    setSelectedReportId('');
    
    setTimeout(() => {
      setBookingSuccess(false);
      setIsBookingOpen(false);
    }, 2000);
  };

  const handleAddReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !onAddMedicalReport) return;

    onAddMedicalReport({
      title: reportTitle,
      date: reportDate || new Date().toISOString().split('T')[0],
      reportText: reportText || undefined,
      findings: reportFindings || undefined,
      extractedMedications: reportMeds ? reportMeds.split(',').map(m => m.trim()).filter(Boolean) : undefined,
      attachmentName: attachmentName || 'medical_document.pdf'
    });

    setReportSuccess(true);
    setReportTitle('');
    setReportText('');
    setReportFindings('');
    setReportMeds('');
    setAttachmentName('');

    setTimeout(() => {
      setReportSuccess(false);
      setIsReportFormOpen(false);
    }, 1500);
  };

  // Generate preparatory advice based on appointment specialty and reason
  const getPrepAdvice = (specialty: string, reason: string) => {
    const rLower = reason.toLowerCase();
    if (specialty.toLowerCase().includes('cardiology') || rLower.includes('heart') || rLower.includes('blood pressure')) {
      return 'Please refrain from caffeine or heavy exercise 4 hours prior. Bring your blood pressure log.';
    }
    if (specialty.toLowerCase().includes('endocrinology') || rLower.includes('diabetes') || rLower.includes('blood test') || rLower.includes('fasting')) {
      return 'Fasting may be required for 8-12 hours before this appointment. Check with the clinic.';
    }
    return 'Please bring your current medication bottles and a list of active symptoms.';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header with Title and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-blue-600" size={32} />
            Doctor Appointments
          </h2>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Book, manage, and view your structured clinic schedules
          </p>
        </div>
        
        <button
          onClick={() => setIsBookingOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 self-start sm:self-center"
        >
          <Plus size={18} />
          Schedule Appointment
        </button>
      </div>

      {/* Grid: Main Schedules & Live AI Clinical Preparation Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 Columns: Structured Scheduled List */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Upcoming Section */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Structured Upcoming Schedule
              </h3>
              <span className="bg-blue-50 text-blue-600 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                {upcomingAppointments.length} Booked
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium border-2 border-dashed border-slate-150 rounded-3xl bg-slate-50/50 space-y-3">
                <CalendarIcon size={36} className="mx-auto text-slate-300" />
                <p className="text-sm">No upcoming appointments scheduled.</p>
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="text-xs font-black text-blue-600 hover:underline"
                >
                  Schedule one now &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((app) => {
                  const advice = getPrepAdvice(app.doctorSpecialty, app.reason || '');
                  return (
                    <div 
                      key={app.id} 
                      className="group relative bg-white border border-slate-200 hover:border-blue-400 p-6 rounded-3xl transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      {/* Doctor & Specialty Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <User size={24} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-base">{app.doctorName}</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{app.doctorSpecialty}</p>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <MapPin size={12} /> {AVAILABLE_DOCTORS.find(d => d.name === app.doctorName)?.hospital || 'Clinic Center'}
                          </p>
                          <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-600 font-medium italic mt-2">
                            "{app.reason}"
                          </div>
                          {(() => {
                            const matchedReport = medicalReports.find(r => r.id === app.medicalReportId);
                            if (matchedReport) {
                              return (
                                <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2 max-w-md">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-700 uppercase tracking-wider">
                                      <FileText size={12} className="text-indigo-600" /> Linked Medical Report
                                    </div>
                                    {matchedReport.doctorName && (
                                      <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase">
                                        Clinician Signed
                                      </span>
                                    )}
                                  </div>
                                  <h6 className="font-bold text-xs text-slate-900 leading-snug">{matchedReport.title}</h6>
                                  <button
                                    type="button"
                                    onClick={() => handleAccessReportSecurely(app)}
                                    className="w-full mt-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-sm text-center"
                                  >
                                    🔒 Access secure details portal
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Scheduled Time & Cancel Actions */}
                      <div className="flex flex-col md:items-end gap-3 justify-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 min-w-[150px]">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date & Time</span>
                          <p className="font-extrabold text-slate-800 text-sm flex items-center md:justify-end gap-1.5 mt-0.5">
                            <CalendarIcon size={14} className="text-blue-500" />
                            {new Date(app.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="font-bold text-slate-600 text-xs flex items-center md:justify-end gap-1.5 mt-0.5">
                            <Clock size={14} className="text-blue-500" />
                            {app.time} AM/PM
                          </p>
                        </div>

                        <button
                          onClick={() => onCancelAppointment(app.id)}
                          className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-[10px] font-black rounded-lg transition-colors uppercase self-start md:self-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Medical Records & Diagnostic Reports Section */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <FolderHeart size={20} className="text-blue-600" />
                  My Medical Records & Diagnostic Reports
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  Upload and manage diagnostic lab panels, clinician notes, and health screenings.
                </p>
              </div>

              <button
                onClick={() => setIsReportFormOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 self-start sm:self-auto"
              >
                <UploadCloud size={14} />
                Upload New Report
              </button>
            </div>

            {(() => {
              const myReports = medicalReports.filter(r => r.patientId === userProfile?.id);
              if (myReports.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-150 rounded-3xl bg-slate-50/50 space-y-2">
                    <FileText size={32} className="mx-auto text-slate-300 animate-pulse" />
                    <p className="text-xs">No diagnostic reports stored in your account.</p>
                    <button
                      onClick={() => setIsReportFormOpen(true)}
                      className="text-xs font-black text-blue-600 hover:underline"
                    >
                      Upload your first medical report &rarr;
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myReports.map((report) => (
                    <div 
                      key={report.id}
                      className="p-5 bg-slate-50 hover:bg-slate-100/40 border border-slate-200/60 rounded-3xl space-y-3 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{report.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Uploaded: {report.date}</p>
                          </div>
                          
                          {onDeleteMedicalReport && (
                            <button
                              onClick={() => onDeleteMedicalReport(report.id)}
                              className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100 shadow-sm transition-colors shrink-0 animate-in fade-in"
                              title="Delete Medical Report"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        {report.attachmentName && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 border border-blue-100 rounded-lg text-[9px] text-blue-700 font-black uppercase">
                            <Paperclip size={10} />
                            {report.attachmentName}
                          </div>
                        )}

                        {report.reportText && (
                          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold italic bg-white p-2.5 rounded-xl border border-slate-100">
                            "{report.reportText}"
                          </p>
                        )}

                        {report.findings && (
                          <div className="text-[10px] font-bold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black uppercase text-indigo-600 block mb-0.5">Clinical Summary</span>
                            {report.findings}
                          </div>
                        )}
                      </div>

                      {report.extractedMedications && report.extractedMedications.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-slate-200/50">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mr-1">Extracted Meds:</span>
                          {report.extractedMedications.map((mName, idx) => (
                            <span key={idx} className="bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {mName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Past/Structured History Section */}
          {pastAppointments.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600" />
                Structured History & Past Consults
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-hide">
                {pastAppointments.map((app) => (
                  <div key={app.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center opacity-85 hover:opacity-100 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200/60 text-slate-500 flex items-center justify-center">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{app.doctorName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{app.doctorSpecialty} • {app.date}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Clinical Appointment Preparation Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/10 shadow-sm">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-base">Clinic Preparation</h4>
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">AI Clinical Advice</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Get clinical recommendations automatically mapped to your booked consults to maximize diagnostic accuracy.
            </p>

            <div className="space-y-4 border-t border-slate-800 pt-6">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.slice(0, 2).map((app, idx) => (
                  <div key={idx} className="space-y-2 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-400 truncate max-w-[120px]">{app.doctorName}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{app.time}</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-bold">
                      {getPrepAdvice(app.doctorSpecialty, app.reason || '')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-850/30 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400 font-bold">
                  Schedule an appointment to receive clinical prep instructions.
                </div>
              )}
            </div>

            <div className="bg-indigo-900/40 border border-indigo-800 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-200 font-medium leading-relaxed">
                Remember to bring your digital health passport / QR code from your Profile settings to sync prescription records instantly at check-in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE APPOINTMENT DIALOG MODAL */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="text-blue-500" size={24} />
                    Schedule Consult
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">Book a session with a clinical specialist</p>
                </div>
                <button 
                  onClick={() => setIsBookingOpen(false)} 
                  className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Select Doctor Specialist */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Doctor Specialist</label>
                  <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {AVAILABLE_DOCTORS.map((doc, idx) => {
                      const isSelected = selectedDoctor.name === doc.name;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDoctor(doc)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50/20 shadow-sm' 
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm">{doc.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{doc.specialty}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">{doc.hospital} • {doc.room}</p>
                          </div>
                          {isSelected && (
                            <span className="p-1 bg-blue-500 text-white rounded-full">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Time Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Appointment Date</label>
                    <input 
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Appointment Time</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                      value={appointmentTime}
                      onChange={e => setAppointmentTime(e.target.value)}
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Attach Stored Medical Report */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Attach Stored Medical Report (Optional)</span>
                    <span className="text-[8px] text-indigo-600 uppercase font-extrabold tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">HIPAA Private</span>
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                    value={selectedReportId}
                    onChange={e => setSelectedReportId(e.target.value)}
                  >
                    <option value="">-- No report attached --</option>
                    {medicalReports
                      .filter(r => r.patientId === userProfile?.id)
                      .map(report => (
                        <option key={report.id} value={report.id}>
                          {report.title} ({report.date})
                        </option>
                      ))}
                  </select>
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed pl-1">
                    Attaching a report automatically grants your practitioner secure read access to view diagnostic details.
                  </p>
                </div>

                {/* Reason for Appointment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason for Consult</label>
                  <textarea
                    placeholder="e.g. Chronic blood pressure spikes, medication allergy concerns, routine health audit..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 ring-blue-500/10 text-slate-800 resize-none"
                    value={visitReason}
                    onChange={e => setVisitReason(e.target.value)}
                  />
                </div>

                {bookingSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse">
                    <CheckCircle size={18} className="text-emerald-600" />
                    Appointment booked and synchronized with health planner!
                  </div>
                )}

                {/* Form Footer Action */}
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isReportFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <FolderHeart className="text-blue-500" size={24} />
                    Upload Diagnostic Report
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">Import diagnostic logs, blood tests, or lab sheets</p>
                </div>
                <button 
                  onClick={() => setIsReportFormOpen(false)} 
                  className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddReportSubmit} className="flex-1 overflow-y-auto p-8 space-y-5">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Report Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Endocrinology Lipid Panel, MRI Scan Report"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                  />
                </div>

                {/* Date and Document Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date of Report</label>
                    <input 
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                      value={reportDate}
                      onChange={e => setReportDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Document File Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. blood_panel_2026.pdf"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                      value={attachmentName}
                      onChange={e => setAttachmentName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clinical/Diagnostic Transcript</label>
                  <textarea
                    placeholder="Paste the clinical notes or diagnostic text here..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 ring-blue-500/10 text-slate-800 resize-none"
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                  />
                </div>

                {/* Findings summary */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Findings Summary</label>
                  <input 
                    type="text"
                    placeholder="e.g. Total cholesterol 240 mg/dL, elevated LDL, thyroid normal"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                    value={reportFindings}
                    onChange={e => setReportFindings(e.target.value)}
                  />
                </div>

                {/* Detected Medications */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Extracted Active Medications (Comma Separated)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Lipitor, Metformin, Synthroid"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/10 text-sm text-slate-800"
                    value={reportMeds}
                    onChange={e => setReportMeds(e.target.value)}
                  />
                  <p className="text-[9px] text-slate-400 font-semibold pl-1">
                    Enter medications diagnosed or prescribed in this report so the system can verify drug compatibility.
                  </p>
                </div>

                {reportSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse">
                    <CheckCircle size={18} className="text-emerald-600" />
                    Medical record uploaded and saved securely to your file!
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsReportFormOpen(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                    Save Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HIPAA SECURE REPORT DETAILS DIALOG FOR PATIENTS */}
      {(selectedReportToView || loadingPHI || phiError) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-750 font-black text-[9px] uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-indigo-600 animate-pulse" /> SECURE PATIENT PHI PORTAL
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {selectedReportToView ? selectedReportToView.title : 'Decrypting Clinical PHI Data...'}
                </h3>
                {selectedReportToView && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    Profile Reference: {userProfile?.name} • File Date: {selectedReportToView.date}
                  </p>
                )}
              </div>
              <button 
                onClick={() => {
                  setSelectedReportToView(null);
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
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider animate-pulse">Establishing HIPAA secure channel & decryption handshake...</p>
                </div>
              ) : phiError ? (
                <div className="py-12 text-center space-y-4">
                  <ShieldAlert size={48} className="text-red-500 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-950">HIPAA Security Exception</h4>
                    <p className="text-xs text-red-600 font-semibold max-w-md mx-auto leading-relaxed">{phiError}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">Please contact administration if you believe this is an error.</p>
                </div>
              ) : selectedReportToView ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Findings */}
                  {selectedReportToView.findings && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Clinical Summary & Doctor's Findings</span>
                      <p className="text-xs text-emerald-950 font-semibold leading-relaxed">
                        {selectedReportToView.findings}
                      </p>
                    </div>
                  )}

                  {/* Detected Medications */}
                  {selectedReportToView.extractedMedications && selectedReportToView.extractedMedications.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Extracted Report Medications</span>
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
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Raw OCR Clinical Text</span>
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl max-h-[220px] overflow-y-auto font-mono text-[11px] text-slate-655 leading-relaxed whitespace-pre-wrap">
                      {selectedReportToView.reportText}
                    </div>
                  </div>

                  {/* Metadata and Compliance tags */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-450">
                      Signature Clinician: {selectedReportToView.doctorName || 'Not signed (Uploaded by Patient)'}
                    </div>
                    {selectedReportToView.attachmentName && (
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-500">
                        Attachment: {selectedReportToView.attachmentName}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> SECURE AUDITED VIEW
              </div>
              <button
                onClick={() => {
                  setSelectedReportToView(null);
                  setPhiError('');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
