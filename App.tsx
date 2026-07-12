import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import AIConsultant from './components/AIConsultant';
import HealthScanner from './components/MedicationScanner';
import ReminderSettings from './components/ReminderSettings';
import PrescriptionScanner from './components/PrescriptionScanner';
import Insights from './components/Insights';
import MedicationAlarm from './components/MedicationAlarm';
import MedicationForm from './components/MedicationForm';
import UserProfile from './components/UserProfile';
import HelpCenter from './components/HelpCenter';
import LogDoseModal from './components/LogDoseModal';
import LogVitalModal from './components/LogVitalModal';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Appointments from './components/Appointments';
import DrugInteractionAnalysis from './components/DrugInteractionAnalysis';
import MessagingCenter from './components/MessagingCenter';
import { dbService } from './services/dbService';
import { DoctorApprovalService } from './services/doctorApprovalService';
import { MedicalReportIntegrationService } from './services/medicalReportIntegrationService';
import { 
  Medication, 
  AdherenceRecord, 
  NavigationTab, 
  Reminder, 
  HealthLog, 
  UserProfile as UserProfileType, 
  UserRole, 
  AuditLog,
  DoctorAppointment,
  Doctor,
  MedicalReport,
  Conversation,
  ConnectionRequest,
  DirectMessage
} from './types';
import { 
  Pill, 
  Settings,
  Plus,
  HeartPulse,
  WifiOff,
  Menu,
  AlertCircle,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Active role of current session
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [selectedAuthRole, setSelectedAuthRole] = useState<UserRole>('patient');

  // Data State
  const [medications, setMedications] = useState<Medication[]>(() => {
    const cached = dbService.getLocal('medications', []);
    if (cached && cached.length > 0) return cached;
    // Seeds initial clinical meds for simulated patient records
    return [
      {
        id: 'seed-med-1',
        profileId: 'patient-1',
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once Daily',
        instructions: 'Take in the morning with or without food',
        remaining: 24,
        lowStockThreshold: 5,
        reminders: [{ id: 'rem-1', time: '08:00', enabled: true }]
      },
      {
        id: 'seed-med-2',
        profileId: 'patient-2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice Daily',
        instructions: 'Take with meals to reduce stomach upset',
        remaining: 45,
        lowStockThreshold: 10,
        reminders: [
          { id: 'rem-2', time: '08:00', enabled: true },
          { id: 'rem-3', time: '18:00', enabled: true }
        ]
      }
    ];
  });

  const [adherence, setAdherence] = useState<AdherenceRecord[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>(() => {
    const cached = dbService.getLocal('medical_reports', []);
    if (cached && cached.length > 0) return cached;
    return [
      {
        id: 'seed-report-1',
        patientId: 'patient-1',
        title: 'Comprehensive Cardiovascular Screening Report',
        date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
        reportText: 'Patient presents with mild hypertension. Blood pressure averages 138/88. Prescribed Amlodipine 5mg. Discontinue conflicting NSAIDs.',
        extractedMedications: ['Amlodipine'],
        findings: 'Stage 1 Hypertension. Normal sinus rhythm.',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      {
        id: 'seed-report-2',
        patientId: 'patient-2',
        title: 'Endocrine Panel & Glucose Analysis',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        reportText: 'HbA1c checked: 7.2%. Confirms Type 2 Diabetes Mellitus. Patient prescribed Metformin 500mg twice daily with meals. Monitor kidney and liver function.',
        extractedMedications: ['Metformin'],
        findings: 'Type 2 Diabetes. Elevated HbA1c.',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];
  });
  const [allProfiles, setAllProfiles] = useState<UserProfileType[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  const [aiContext, setAiContext] = useState<{ query: string, image?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingReminders, setEditingReminders] = useState<Medication | null>(null);
  const [isMedicationFormOpen, setIsMedicationFormOpen] = useState(false);
  const [isLogVitalOpen, setIsLogVitalOpen] = useState(false);
  const [logDoseMed, setLogDoseMed] = useState<Medication | null>(null);
  const [isPrescriptionScannerOpen, setIsPrescriptionScannerOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{ med: Medication, reminder: Reminder } | null>(null);
  const [lastNotifiedMinute, setLastNotifiedMinute] = useState<string>('');
  const [lowStockAlerts, setLowStockAlerts] = useState<{ id: string; medName: string; remaining: number; threshold: number }[]>([]);

  // Doctors / Clinicians state
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const cached = dbService.getLocal('registered_doctors', null);
    if (cached) return cached;
    return [
      {
        id: 'doc-101',
        name: 'Dr. Elizabeth Blackwell',
        email: 'blackwell@healthcare.ai',
        specialty: 'Internal Medicine',
        licenseNumber: 'MD-83204',
        isVerified: true,
        status: 'verified',
        hospital: 'Johns Hopkins Hospital',
        password: '123456'
      },
      {
        id: 'doc-102',
        name: 'Dr. Sarah Connor',
        email: 'sconnor@healthcare.ai',
        specialty: 'Cardiology',
        licenseNumber: 'MD-92401',
        isVerified: false,
        status: 'pending',
        hospital: 'Mayo Clinic',
        password: '123456'
      },
      {
        id: 'doc-103',
        name: 'Dr. Gregory House',
        email: 'ghouse@healthcare.ai',
        specialty: 'Diagnostic Medicine',
        licenseNumber: 'MD-10492',
        isVerified: false,
        status: 'pending',
        hospital: 'Princeton-Plainsboro',
        password: '123456'
      },
      {
        id: 'doc-104',
        name: 'Dr. Alexander Fleming',
        email: 'fleming@healthcare.ai',
        specialty: 'Endocrinology & General Practice',
        licenseNumber: 'MD-54321',
        isVerified: true,
        status: 'verified',
        hospital: 'Metro General Hospital',
        password: '123456'
      }
    ];
  });

  // HIPAA System Audit Log state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = dbService.getLocal('system_audit_logs', null);
    if (cached) return cached;
    return [
      {
        id: 'log-1',
        userId: 'system-bootstrap',
        userRole: 'admin',
        userEmail: 'admin@healthcare.ai',
        action: 'System Bootstrapping',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toLocaleString(),
        ipAddress: '192.168.1.1',
        hipaaCompliant: true,
        details: 'DailyMed RxNorm catalogs compiled with 186k active vectors.'
      }
    ];
  });

  // Doctor Appointments state
  const [appointments, setAppointments] = useState<DoctorAppointment[]>(() => {
    const cached = dbService.getLocal('appointments', null);
    if (cached) return cached;
    return [
      {
        id: 'seed-app-1',
        patientId: 'patient-1',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        doctorName: 'Dr. Elizabeth Blackwell',
        doctorSpecialty: 'Cardiology',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        time: '10:00',
        reason: 'Follow-up on Amlodipine blood pressure response',
        status: 'scheduled'
      },
      {
        id: 'seed-app-2',
        patientId: 'patient-2',
        patientName: 'Alice Smith',
        patientEmail: 'alice@example.com',
        doctorName: 'Dr. Alexander Fleming',
        doctorSpecialty: 'Endocrinology & General Practice',
        date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        time: '14:00',
        reason: 'Evaluating Metformin dosage and blood glucose logs',
        status: 'scheduled'
      }
    ];
  });

  // ---- Messaging State ----
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    dbService.getConversations()
  );
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(() =>
    dbService.getConnectionRequests()
  );

  const activeProfile = useMemo(() => 
    allProfiles.find(p => p.id === activeProfileId) || null, 
    [allProfiles, activeProfileId]
  );

  const logAuditAction = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: activeProfileId || 'provider-session-id',
      userRole: activeRole || 'patient',
      userEmail: activeProfile?.email || dbService.activeEmail || 'anonymous',
      action,
      timestamp: new Date().toLocaleString(),
      ipAddress: '192.168.1.144',
      hipaaCompliant: true,
      details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      dbService.setLocal('system_audit_logs', updated);
      return updated;
    });
  }, [activeProfileId, activeRole, activeProfile]);

  // Simulated full patient rosters (HIPAA verified directory)
  const simulatedPatients: UserProfileType[] = useMemo(() => {
    return [
      {
        id: 'patient-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0199',
        age: '45',
        weight: '82kg',
        bloodType: 'A+',
        notifications: { enabled: true },
        allergies: ['Penicillin'],
        chronicConditions: ['Hypertension', 'Asthma']
      },
      {
        id: 'patient-2',
        name: 'Alice Smith',
        email: 'alice@example.com',
        phone: '555-0182',
        age: '32',
        weight: '64kg',
        bloodType: 'O-',
        notifications: { enabled: true },
        allergies: ['Aspirin'],
        chronicConditions: ['Diabetes Type 2']
      },
      ...(activeProfile ? [activeProfile] : [])
    ];
  }, [activeProfile]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeAppData = useCallback(async () => {
    setLoading(true);
    const email = dbService.activeEmail;
    const cachedRole = dbService.getLocal('user_role', null);
    
    // Load local caches immediately to guarantee high-performance, instant offline startup
    const cachedProfile = dbService.getLocal('user_profile', null);
    const cachedMeds = dbService.getLocal('medications', []);
    const cachedAdherence = dbService.getLocal('adherence', []);
    const cachedLogs = dbService.getLocal('health_logs', []);
    const cachedReports = dbService.getLocal('medical_reports', []);

    if (cachedRole) {
      setActiveRole(cachedRole);
    }

    if (email && email !== 'anonymous') {
      if (cachedProfile) {
        setAllProfiles([cachedProfile]);
        setActiveProfileId(cachedProfile.id);
        if (cachedMeds.length > 0) setMedications(cachedMeds);
        setAdherence(cachedAdherence);
        setHealthLogs(cachedLogs);
        if (cachedReports.length > 0) setMedicalReports(cachedReports);
        setIsInitialized(true);
      }
    } else if (email === 'anonymous') {
      const guestProfile = cachedProfile || {
        id: 'guest',
        name: 'Guest User',
        email: 'anonymous',
        phone: '',
        age: '42',
        weight: '75kg',
        bloodType: 'B+',
        notifications: { enabled: true },
        allergies: ['Sulfonamides'],
        chronicConditions: ['High Cholesterol']
      };
      setAllProfiles([guestProfile]);
      setActiveProfileId(guestProfile.id);
      if (cachedMeds.length > 0) setMedications(cachedMeds);
      setAdherence(cachedAdherence);
      setHealthLogs(cachedLogs);
      if (cachedReports.length > 0) setMedicalReports(cachedReports);
      setIsInitialized(true);
      setLoading(false);
      return;
    }

    try {
      if (email && email !== 'anonymous' && cachedRole === 'patient') {
        const profile = await dbService.getUserProfile();
        if (profile) {
          setAllProfiles([profile]);
          setActiveProfileId(profile.id);
          const [meds, records, logs, reports] = await Promise.all([
            dbService.getMedications().catch(() => cachedMeds),
            dbService.getAdherence().catch(() => cachedAdherence),
            dbService.getLogs().catch(() => cachedLogs),
            dbService.getMedicalReports().catch(() => cachedReports)
          ]);
          if (meds && meds.length > 0) setMedications(meds);
          setAdherence(records);
          setHealthLogs(logs);
          if (reports && reports.length > 0) setMedicalReports(reports);
          setIsInitialized(true);
        } else {
          if (cachedProfile) {
            setIsInitialized(true);
          } else {
            setIsInitialized(false);
          }
        }
      } else if (email && cachedRole) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.warn("Network sync failed, running in offline mode:", error);
      setIsOffline(true);
      if (email && email !== 'anonymous' && cachedProfile) {
        setIsInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAppData();
  }, [initializeAppData]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentMinute = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      if (currentMinute !== lastNotifiedMinute) {
        medications.forEach(med => {
          // Only trigger alarms for active profile's meds in Patient view
          if (activeRole === 'patient' && med.profileId === activeProfileId) {
            med.reminders.forEach(rem => {
              if (rem.enabled && rem.time === currentMinute) {
                setActiveAlarm({ med, reminder: rem });
                setLastNotifiedMinute(currentMinute);
              }
            });
          }
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [medications, lastNotifiedMinute, activeRole, activeProfileId]);

  const handleAuthSuccess = async (user: { name: string; email: string }, role: UserRole) => {
    setLoading(true);
    setActiveRole(role);
    dbService.setLocal('user_role', role);
    logAuditAction('Security Authentication Success', `User logged in as role: ${role}`);

    try {
      if (role === 'patient') {
        let profile = await dbService.getUserProfile();
        if (!profile) {
          profile = {
            id: Math.random().toString(36).substr(2, 9),
            name: user.name,
            email: user.email,
            phone: '',
            age: '40',
            weight: '70kg',
            bloodType: 'A-',
            notifications: { enabled: true },
            allergies: ['Penicillin'],
            chronicConditions: ['Asthma']
          };
          await dbService.saveUserProfile(profile);
        }
        setAllProfiles([profile]);
        setActiveProfileId(profile.id);
        setIsInitialized(true);
        const [meds, records, logs] = await Promise.all([
          dbService.getMedications().catch(() => []),
          dbService.getAdherence().catch(() => []),
          dbService.getLogs().catch(() => [])
        ]);
        if (meds && meds.length > 0) setMedications(meds);
        setAdherence(records);
        setHealthLogs(logs);
      } else {
        // Clinicians and Admins
        setIsInitialized(true);
      }
    } catch (err) {
      console.warn("Database sync failed after authentication, loading fallback offline caches.", err);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    logAuditAction('Security Logout Session', 'Terminated active credentials session.');
    setIsInitialized(false);
    setActiveRole(null);
    setShowAuth(false);
    setLoading(true);
    try {
      await dbService.resetAll();
    } catch (e) {
      console.warn("Reset user session database cache failed:", e);
    }
    // Keep seed medications if clearing cache
    setMedications([
      {
        id: 'seed-med-1',
        profileId: 'patient-1',
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once Daily',
        instructions: 'Take in the morning with or without food',
        remaining: 24,
        lowStockThreshold: 5,
        reminders: [{ id: 'rem-1', time: '08:00', enabled: true }]
      },
      {
        id: 'seed-med-2',
        profileId: 'patient-2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice Daily',
        instructions: 'Take with meals to reduce stomach upset',
        remaining: 45,
        lowStockThreshold: 10,
        reminders: [
          { id: 'rem-2', time: '08:00', enabled: true },
          { id: 'rem-3', time: '18:00', enabled: true }
        ]
      }
    ]);
    setAdherence([]);
    setHealthLogs([]);
    setAllProfiles([]);
    setActiveProfileId('');
    setLoading(false);
  };

  const triggerLowStockNotification = (medName: string, remaining: number, threshold: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Low Stock Warning ⚠️', {
          body: `${medName} is running low! Only ${remaining} units remaining (Threshold is ${threshold}).`,
          tag: `low-stock-${medName}`
        });
      } catch (e) {
        console.warn('Could not trigger browser notification:', e);
      }
    }

    const id = Math.random().toString(36).substr(2, 9);
    setLowStockAlerts(prev => [...prev, { id, medName, remaining, threshold }]);
    setTimeout(() => {
      setLowStockAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 8000);
  };

  const handleMarkTaken = async (medId: string, time: string, date: string) => {
    const newRecord: AdherenceRecord = {
      date,
      profileId: activeProfileId,
      medicationId: medId,
      taken: true,
      timeTaken: time
    };
    const updatedAdherence = [...adherence, newRecord];
    setAdherence(updatedAdherence);
    dbService.saveAdherence(updatedAdherence);

    const updatedMeds = medications.map(m => {
      if (m.id === medId) {
        const remaining = Math.max(0, m.remaining - 1);
        const threshold = m.lowStockThreshold ?? 5;
        if (remaining <= threshold) {
          triggerLowStockNotification(m.name, remaining, threshold);
        }
        return { ...m, remaining };
      }
      return m;
    });
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    setLogDoseMed(null);
    setActiveAlarm(null);
    logAuditAction('Logged Medication Dose', `Recorded dose taken for medication ID: ${medId}`);
  };

  const handleAddMedication = async (medData: Omit<Medication, 'id' | 'profileId'>) => {
    const newMed: Medication = {
      ...medData,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    };
    const updatedMeds = [...medications, newMed];
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    setIsMedicationFormOpen(false);
    logAuditAction('Medication Tracked', `Added medication: ${medData.name} to patient file.`);
  };

  const handleAddMedicationToPatient = useCallback(async (medData: Omit<Medication, 'id' | 'profileId'>, patientId: string) => {
    const newMed: Medication = {
      ...medData,
      id: Math.random().toString(36).substr(2, 9),
      profileId: patientId
    };
    setMedications(prev => {
      const updated = [...prev, newMed];
      dbService.saveMedications(updated);
      return updated;
    });
  }, []);

  const handleImportMeds = async (medsData: Omit<Medication, 'id' | 'profileId'>[]) => {
    const newMeds: Medication[] = medsData.map(m => ({
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    }));
    const updatedMeds = [...medications, ...newMeds];
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    setIsPrescriptionScannerOpen(false);
    logAuditAction('Prescriptions Imported', `Imported ${medsData.length} medications via OCR scanning.`);
  };

  const handleUpdateReminders = async (medId: string, reminders: Reminder[], remaining?: number, lowStockThreshold?: number) => {
    const updatedMeds = medications.map(m => 
      m.id === medId 
        ? { 
            ...m, 
            reminders, 
            remaining: remaining !== undefined ? remaining : m.remaining, 
            lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : m.lowStockThreshold 
          } 
        : m
    );
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    logAuditAction('Reminders Configured', `Updated schedules and stock thresholds for medication ID: ${medId}`);
  };

  const handleLogVital = async (logData: Omit<HealthLog, 'id' | 'profileId'>) => {
    const newLog: HealthLog = {
      ...logData,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    };
    const updatedLogs = [...healthLogs, newLog];
    setHealthLogs(updatedLogs);
    dbService.saveLogs(updatedLogs);
    setIsLogVitalOpen(false);
    logAuditAction('Health Vital Logged', `Logged clinical vital metrics: ${logData.type} (${logData.value})`);
  };

  const handleUpdateProfile = async (profile: UserProfileType) => {
    setAllProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    dbService.saveUserProfile(profile);
    logAuditAction('Profile Modified', `Updated personal demographics and chronic markers.`);
  };

  const handleAddAppointment = useCallback(async (appData: Omit<DoctorAppointment, 'id'>) => {
    const newApp: DoctorAppointment = {
      ...appData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setAppointments(prev => {
      const updated = [...prev, newApp];
      dbService.setLocal('appointments', updated);
      return updated;
    });
    logAuditAction('Appointment Scheduled', `Patient scheduled consultation with ${appData.doctorName} on ${appData.date} at ${appData.time}`);
  }, [logAuditAction]);

  const handleCancelAppointment = useCallback((id: string) => {
    setAppointments(prev => {
      const updated = prev.filter(app => app.id !== id);
      dbService.setLocal('appointments', updated);
      return updated;
    });
    logAuditAction('Appointment Cancelled', `Patient cancelled scheduled consultation ID: ${id}`);
  }, [logAuditAction]);

  const handleAddMedicalReport = useCallback(async (reportData: Omit<MedicalReport, 'id' | 'createdAt' | 'patientId'>) => {
    const newReport: MedicalReport = {
      ...reportData,
      id: Math.random().toString(36).substr(2, 9),
      patientId: activeProfileId,
      createdAt: new Date().toISOString()
    };
    setMedicalReports(prev => {
      const updated = [newReport, ...prev];
      dbService.saveMedicalReports(updated);
      return updated;
    });
    logAuditAction('Medical Report Uploaded', `Added medical report: "${reportData.title}" to patient file.`);
  }, [activeProfileId, logAuditAction]);

  const handleDeleteMedicalReport = useCallback(async (id: string) => {
    setMedicalReports(prev => {
      const updated = prev.filter(r => r.id !== id);
      dbService.saveMedicalReports(updated);
      return updated;
    });
    logAuditAction('Medical Report Deleted', `Removed medical report ID: ${id}`);
  }, [logAuditAction]);

  const handleLinkReportToAppointment = useCallback(async (appointmentId: string, reportId: string) => {
    try {
      const activeDoc = doctors.find(d => d.email.toLowerCase() === dbService.activeEmail?.toLowerCase());
      const doctorId = activeDoc ? activeDoc.id : 'doctor-id';
      
      const { appointments: updatedApps } = await MedicalReportIntegrationService.linkReportToAppointment(
        appointmentId,
        reportId,
        doctorId,
        activeRole || 'doctor',
        dbService.activeEmail || 'anonymous',
        logAuditAction
      );
      setAppointments(updatedApps);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to link medical report.");
    }
  }, [doctors, activeRole, logAuditAction]);

  const handleShareReportWithPatient = useCallback(async (reportId: string) => {
    try {
      const activeDoc = doctors.find(d => d.email.toLowerCase() === dbService.activeEmail?.toLowerCase());
      const dName = activeDoc ? activeDoc.name : 'Dr. Practitioner';
      
      const { reports: updatedReports } = await MedicalReportIntegrationService.shareReportWithPatient(
        reportId,
        dName,
        dbService.activeEmail || 'anonymous',
        logAuditAction
      );
      setMedicalReports(updatedReports);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to share medical report.");
    }
  }, [doctors, logAuditAction]);

  const handleUpdateAppointmentStatus = useCallback((id: string, status: 'completed' | 'cancelled') => {
    setAppointments(prev => {
      const updated = prev.map(app => app.id === id ? { ...app, status } : app);
      dbService.setLocal('appointments', updated);
      return updated;
    });
    logAuditAction('Appointment Status Updated', `Provider set appointment ID: ${id} status to ${status}`);
  }, [logAuditAction]);

  const handleRegisterDoctor = useCallback((newDoc: Doctor) => {
    setDoctors(prev => {
      const updated = [...prev, newDoc];
      dbService.setLocal('registered_doctors', updated);
      return updated;
    });
    logAuditAction('Practitioner Onboarding Registered', `Doctor registered: ${newDoc.name} (${newDoc.specialty}) at ${newDoc.hospital} - Status: PENDING.`);
  }, [logAuditAction]);

  const handleUpdateDoctor = useCallback((updatedDoc: Doctor) => {
    setDoctors(prev => {
      const updated = prev.map(d => d.id === updatedDoc.id ? updatedDoc : d);
      dbService.setLocal('registered_doctors', updated);
      return updated;
    });
    logAuditAction('Doctor Profile Updated', `Doctor ${updatedDoc.name} updated their professional profile details (specialty, contact information).`);
  }, [logAuditAction]);

  const handleVerifyDoctor = useCallback((id: string) => {
    setDoctors(prev => {
      const { updatedDoctors, doctor } = DoctorApprovalService.verifyDoctor(id, prev);
      dbService.setLocal('registered_doctors', updatedDoctors);
      if (doctor) {
        logAuditAction('Practitioner Verified', `Administrator approved credentials for ${doctor.name} (License: ${doctor.licenseNumber}) via DoctorApprovalService. Login unlocked.`);
      }
      return updatedDoctors;
    });
  }, [logAuditAction]);

  const handleRejectDoctor = useCallback((id: string, reason: string) => {
    setDoctors(prev => {
      const { updatedDoctors, doctor } = DoctorApprovalService.rejectDoctor(id, reason, prev);
      dbService.setLocal('registered_doctors', updatedDoctors);
      if (doctor) {
        logAuditAction('Practitioner Rejected', `Administrator rejected credentials for ${doctor.name} (License: ${doctor.licenseNumber}) via DoctorApprovalService. Reason: ${reason}.`);
      }
      return updatedDoctors;
    });
  }, [logAuditAction]);

  // ---- Messaging Handlers ----

  const handleSendConnectionRequest = useCallback((doctor: Doctor, message: string) => {
    if (!activeProfile) return;
    const reqId = Math.random().toString(36).substr(2, 9);
    const newRequest: ConnectionRequest = {
      id: reqId,

      patientId: activeProfileId,
      patientName: activeProfile.name,
      patientEmail: activeProfile.email,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorEmail: doctor.email,
      status: 'pending',
      requestDate: new Date().toLocaleDateString(),
      message: message || undefined,
    };
    const updated = [...connectionRequests, newRequest];
    setConnectionRequests(updated);
    dbService.saveConnectionRequests(updated);
    logAuditAction('Connection Request Sent', `Patient ${activeProfile.name} requested connection with ${doctor.name}.`);
  }, [activeProfile, activeProfileId, connectionRequests, logAuditAction]);

  const handleAcceptConnectionRequest = useCallback((requestId: string) => {
    const req = connectionRequests.find(r => r.id === requestId);
    if (!req) return;
    // Update request status
    const updatedRequests = connectionRequests.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const, responseDate: new Date().toLocaleDateString() } : r
    );
    setConnectionRequests(updatedRequests);
    dbService.saveConnectionRequests(updatedRequests);
    // Create conversation if it doesn't exist
    const existing = conversations.find(c => c.patientId === req.patientId && c.doctorEmail === req.doctorEmail);
    if (!existing) {
      const newConv: Conversation = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: req.patientId,
        patientName: req.patientName,
        patientEmail: req.patientEmail,
        doctorId: req.doctorId,
        doctorName: req.doctorName,
        doctorEmail: req.doctorEmail,
        connectionStatus: 'accepted',
        unreadByDoctor: 0,
        unreadByPatient: 0,
      };
      const updatedConvs = [...conversations, newConv];
      setConversations(updatedConvs);
      dbService.saveConversations(updatedConvs);
    }
    logAuditAction('Connection Request Accepted', `Doctor accepted connection with patient ${req.patientName}.`);
  }, [connectionRequests, conversations, logAuditAction]);

  const handleDeclineConnectionRequest = useCallback((requestId: string) => {
    const updatedRequests = connectionRequests.map(r =>
      r.id === requestId ? { ...r, status: 'declined' as const, responseDate: new Date().toLocaleDateString() } : r
    );
    setConnectionRequests(updatedRequests);
    dbService.saveConnectionRequests(updatedRequests);
    logAuditAction('Connection Request Declined', `Doctor declined connection request ID: ${requestId}.`);
  }, [connectionRequests, logAuditAction]);

  const handleSendMessage = useCallback((conversationId: string, content: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    const isDoctor = activeRole === 'doctor';
    const senderName = isDoctor
      ? (doctors.find(d => d.email.toLowerCase() === dbService.activeEmail?.toLowerCase())?.name || 'Doctor')
      : (activeProfile?.name || 'Patient');
    const newMsg: DirectMessage = {
      id: Math.random().toString(36).substr(2, 9),
      conversationId,
      senderId: isDoctor ? conv.doctorId : conv.patientId,
      senderName,
      senderRole: isDoctor ? 'doctor' : 'patient',
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const existingMsgs = dbService.getMessages(conversationId);
    dbService.saveMessages(conversationId, [...existingMsgs, newMsg]);
    // Update conversation last message + unread count
    const updatedConvs = conversations.map(c =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: content,
            lastMessageAt: new Date().toISOString(),
            unreadByDoctor: isDoctor ? c.unreadByDoctor : c.unreadByDoctor + 1,
            unreadByPatient: isDoctor ? c.unreadByPatient + 1 : c.unreadByPatient,
          }
        : c
    );
    setConversations(updatedConvs);
    dbService.saveConversations(updatedConvs);
  }, [conversations, activeRole, activeProfile, doctors]);

  const handleConversationsChange = useCallback((convs: Conversation[]) => {
    setConversations(convs);
    dbService.saveConversations(convs);
  }, []);

  // Compute total patient unread messages
  const patientUnreadMessages = useMemo(() =>
    conversations
      .filter(c => c.patientId === activeProfileId && c.connectionStatus === 'accepted')
      .reduce((sum, c) => sum + c.unreadByPatient, 0),
    [conversations, activeProfileId]
  );

  // Rendering Loader
  if (loading && !isInitialized && activeRole) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
          <HeartPulse size={40} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Accessing Health Vault</h2>
          <p className="text-slate-400 font-medium">Securing your medical data link...</p>
        </div>
      </div>
    );
  }

  // 1. PUBLIC WEBSITES / AUTH PORTALS
  if (activeRole === null) {
    if (showAuth) {
      return (
        <Auth 
          role={selectedAuthRole} 
          onAuthSuccess={handleAuthSuccess} 
          onCancel={() => {
            setShowAuth(false);
            setActiveRole(null);
          }} 
          doctors={doctors}
          onRegisterDoctor={handleRegisterDoctor}
        />
      );
    }
    return (
      <LandingPage 
        onAccessPortal={(role) => {
          setSelectedAuthRole(role);
          setShowAuth(true);
        }} 
      />
    );
  }

  // 2. DOCTOR WORKSPACE PORTAL
  if (activeRole === 'doctor') {
    const activeDoc = doctors.find(d => d.email.toLowerCase() === dbService.activeEmail?.toLowerCase());
    return (
      <DoctorDashboard 
        doctorName={activeDoc ? activeDoc.name : 'Dr. Practitioner'} 
        doctorEmail={dbService.activeEmail || ''}
        activeDoctor={activeDoc || null}
        onUpdateDoctor={handleUpdateDoctor}
        onLogout={handleLogout}
        allPatients={simulatedPatients}
        allMedications={medications}
        onAddMedicationToPatient={handleAddMedicationToPatient}
        onLogAudit={logAuditAction}
        appointments={appointments}
        onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
        medicalReports={medicalReports}
        onLinkReportToAppointment={handleLinkReportToAppointment}
        onShareReportWithPatient={handleShareReportWithPatient}
        conversations={conversations}
        connectionRequests={connectionRequests}
        onAcceptConnectionRequest={handleAcceptConnectionRequest}
        onDeclineConnectionRequest={handleDeclineConnectionRequest}
        onSendMessage={handleSendMessage}
        onConversationsChange={handleConversationsChange}
      />
    );
  }

  // 3. SYSTEM ADMINISTRATION PORTAL
  if (activeRole === 'admin') {
    return (
      <AdminDashboard 
        onLogout={handleLogout}
        auditLogs={auditLogs}
        onClearLogs={() => {
          setAuditLogs([]);
          dbService.setLocal('system_audit_logs', []);
        }}
        doctorsList={doctors}
        onVerifyDoctor={handleVerifyDoctor}
        onRejectDoctor={handleRejectDoctor}
      />
    );
  }

  // Filter current patient's active medications (for Patient Companion Dashboard)
  const currentPatientMeds = medications.filter(m => m.profileId === activeProfileId);

  // 4. PATIENT COMPANION DASHBOARD (STANDARD HUB)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        profiles={allProfiles}
        activeProfileId={activeProfileId}
        onSwitchProfile={setActiveProfileId}
        onAddProfile={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        unreadMessages={patientUnreadMessages}
      />
      
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 left-0 right-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <HeartPulse className="text-blue-600 w-6 h-6" />
            <span className="font-extrabold text-slate-900 text-sm">Healthcare AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOffline && <WifiOff size={16} className="text-orange-500" />}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            {activeProfile?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} unreadMessages={patientUnreadMessages} />

      {isOffline && (
        <div className="md:ml-64 fixed top-0 md:top-0 left-0 right-0 z-[60] bg-orange-500 text-white py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={12} /> Offline Mode Active
        </div>
      )}

      <main className={`md:ml-64 p-4 md:p-8 lg:p-12 pb-24 md:pb-8 transition-all`}>
        {activeTab === NavigationTab.DASHBOARD && (
          <Dashboard 
            medications={currentPatientMeds}
            adherence={adherence}
            userProfile={activeProfile}
            onMarkTakenClick={setLogDoseMed}
            onAddClick={() => setIsMedicationFormOpen(true)}
            onLogVitalClick={() => setIsLogVitalOpen(true)}
          />
        )}
        {activeTab === NavigationTab.MEDICATIONS && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Medications</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPrescriptionScannerOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 text-sm"
                >
                  Import
                </button>
                <button 
                  onClick={() => setIsMedicationFormOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg text-sm"
                >
                  <Plus size={18} /> New
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPatientMeds.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
                  No medications tracked yet. Click New or Import to begin.
                </div>
              ) : (
                currentPatientMeds.map(med => {
                  const threshold = med.lowStockThreshold ?? 5;
                  const isLowStock = med.remaining <= threshold;
                  return (
                    <div 
                      key={med.id} 
                      className={`card p-6 hover:shadow-md transition-all relative overflow-hidden border-2 ${
                        isLowStock ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100'
                      }`}
                    >
                      {isLowStock && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                          <AlertCircle size={10} /> Low Stock
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isLowStock ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Pill size={20} />
                        </div>
                        <button 
                          onClick={() => setEditingReminders(med)}
                          className={`p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 ${isLowStock ? 'mr-12' : ''}`}
                          title="Configure medication and stock alerts"
                        >
                          <Settings size={18} />
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{med.name}</h3>
                      <p className="text-xs font-semibold text-slate-500 mb-4">{med.dosage} • {med.frequency}</p>
                      
                      {med.lowStockThreshold !== undefined && (
                        <p className="text-[10px] font-bold text-slate-400 mb-1">
                          Low Stock Threshold: <span className="font-extrabold text-slate-600">{med.lowStockThreshold} units</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-6">
                        <div className={`text-[10px] font-black uppercase tracking-widest ${
                          isLowStock ? 'text-amber-600 animate-pulse' : 'text-slate-400'
                        }`}>
                          {med.remaining} Units Left
                        </div>
                        <button 
                          onClick={() => setLogDoseMed(med)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            isLowStock 
                              ? 'bg-amber-600 text-white hover:bg-amber-700' 
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          Log Dose
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        {activeTab === NavigationTab.HEALTH_SCANNER && (
          <HealthScanner 
            onAddMedication={handleAddMedication}
            onConsultAI={(query, image) => {
              setAiContext({ query, image });
              setActiveTab(NavigationTab.AI_CONSULT);
            }}
            onOpenPrescriptionScanner={() => setIsPrescriptionScannerOpen(true)}
          />
        )}
        {activeTab === NavigationTab.AI_CONSULT && (
          <AIConsultant 
            initialQuery={aiContext?.query}
            initialImage={aiContext?.image}
            onResetContext={() => setAiContext(null)}
            userProfile={activeProfile}
            medicalReports={medicalReports}
            healthLogs={healthLogs}
            onAddAppointment={handleAddAppointment}
          />
        )}
        {activeTab === NavigationTab.INSIGHTS && (
          <Insights 
            medications={currentPatientMeds}
            adherence={adherence}
            healthLogs={healthLogs}
            onExport={() => alert('Exporting encrypted medical records...')}
            profile={activeProfile}
          />
        )}
        {activeTab === NavigationTab.PROFILE && (
          <UserProfile 
            profile={activeProfile!}
            onUpdate={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
        {activeTab === NavigationTab.APPOINTMENTS && (
          <Appointments 
            appointments={appointments}
            userProfile={activeProfile}
            onAddAppointment={handleAddAppointment}
            onCancelAppointment={handleCancelAppointment}
            medicalReports={medicalReports}
            onAddMedicalReport={handleAddMedicalReport}
            onDeleteMedicalReport={handleDeleteMedicalReport}
            onLogAudit={logAuditAction}
          />
        )}
        {activeTab === NavigationTab.DRUG_INTERACTION && (
          <DrugInteractionAnalysis 
            currentMeds={currentPatientMeds}
            userProfile={activeProfile}
          />
        )}
        {activeTab === NavigationTab.MESSAGES && activeProfile && (
          <MessagingCenter
            currentPatient={activeProfile}
            verifiedDoctors={doctors.filter(d => d.isVerified && d.status === 'verified')}
            conversations={conversations}
            connectionRequests={connectionRequests}
            onSendConnectionRequest={handleSendConnectionRequest}
            onSendMessage={handleSendMessage}
            onConversationsChange={handleConversationsChange}
          />
        )}
        {activeTab === NavigationTab.HELP_CENTER && <HelpCenter />}
      </main>

      {/* Overlays */}
      {isMedicationFormOpen && (
        <MedicationForm 
          onClose={() => setIsMedicationFormOpen(false)}
          onSave={handleAddMedication}
        />
      )}
      {isLogVitalOpen && (
        <LogVitalModal 
          onClose={() => setIsLogVitalOpen(false)}
          onLog={handleLogVital}
        />
      )}
      {logDoseMed && (
        <LogDoseModal 
          medication={logDoseMed}
          onClose={() => setLogDoseMed(null)}
          onLog={handleMarkTaken}
        />
      )}
      {editingReminders && (
        <ReminderSettings 
          medication={editingReminders}
          onClose={() => setEditingReminders(null)}
          onUpdateReminders={handleUpdateReminders}
        />
      )}
      {isPrescriptionScannerOpen && (
        <PrescriptionScanner 
          onClose={() => setIsPrescriptionScannerOpen(false)}
          onImport={handleImportMeds}
        />
      )}
      {activeAlarm && (
        <MedicationAlarm 
          medication={activeAlarm.med}
          reminder={activeAlarm.reminder}
          onDismiss={() => setActiveAlarm(null)}
          onTake={(id) => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const date = now.toISOString().split('T')[0];
            handleMarkTaken(id, time, date);
          }}
        />
      )}

      {/* Floating Low Stock Toast Notifications */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-[200] space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {lowStockAlerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-amber-500 text-white p-5 rounded-3xl shadow-xl flex items-start gap-4 border border-amber-400 relative overflow-hidden"
            >
              <div className="p-2.5 bg-amber-600 rounded-2xl">
                <AlertCircle size={22} className="text-white animate-bounce" />
              </div>
              <div className="flex-1 pr-6">
                <h5 className="font-black uppercase tracking-wider text-[11px] text-amber-100">Low Stock Alert</h5>
                <p className="font-extrabold text-base tracking-tight mt-0.5 leading-snug">{alert.medName}</p>
                <p className="text-xs font-semibold text-amber-50 mt-1">
                  Only <span className="underline font-black">{alert.remaining}</span> units remaining! (Threshold: {alert.threshold})
                </p>
              </div>
              <button
                onClick={() => setLowStockAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="absolute top-4 right-4 p-1 text-amber-200 hover:text-white rounded-lg transition-colors"
                title="Dismiss Alert"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
