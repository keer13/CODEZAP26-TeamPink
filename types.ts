
export interface Reminder {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
  days?: number[]; // 0-6 for Sunday-Saturday
  message?: string; // Custom alarm message
}

export interface Medication {
  id: string;
  profileId: string; // Scoped to a specific family member
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  remaining: number;
  total: number;
  instructions?: string;
  reminders: Reminder[];
  lowStockThreshold?: number; // User-defined alert threshold
}

export interface AdherenceRecord {
  date: string;
  profileId: string; // Scoped to a specific family member
  medicationId: string;
  taken: boolean;
  timeTaken?: string;
}

export interface HealthLog {
  id: string;
  profileId: string;
  date: string;
  type: 'blood_pressure' | 'glucose' | 'weight' | 'mood';
  value: string;
  unit: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  weight: string;
  bloodType: string;
  isDependent?: boolean;
  parentId?: string; // For family tree linking
  notifications: {
    enabled: boolean;
  };
  allergies?: string[]; // Clinical parameter for allergen conflict checking
  chronicConditions?: string[]; // Chronic diseases for disease contraindication checks
  isPregnancy?: boolean; // Pregnancy warning check
  kidneyImpairment?: boolean; // Kidney warning check
  liverImpairment?: boolean; // Liver warning check
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// ---- Direct Messaging & Connection System ----

export interface ConnectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  requestDate: string;
  responseDate?: string;
  message?: string;
}

export interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadByDoctor: number;
  unreadByPatient: number;
  connectionStatus: 'pending' | 'accepted';
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'doctor';
  content: string;
  timestamp: string;
  isRead: boolean;
}

// ---- Medical History ----

export type MedicalHistoryType =
  | 'diagnosis'
  | 'prescription'
  | 'lab_result'
  | 'vital'
  | 'note'
  | 'surgery'
  | 'allergy';

export interface MedicalHistoryEntry {
  id: string;
  patientId: string;
  type: MedicalHistoryType;
  title: string;
  description: string;
  date: string;
  doctorName?: string;
  createdAt: string;
}

export enum NavigationTab {
  DASHBOARD = 'dashboard',
  MEDICATIONS = 'medications',
  HEALTH_SCANNER = 'health_scanner',
  AI_CONSULT = 'ai_consult',
  INSIGHTS = 'insights',
  PROFILE = 'profile',
  HELP_CENTER = 'help_center',
  APPOINTMENTS = 'appointments',
  DRUG_INTERACTION = 'drug_interaction',
  MESSAGES = 'messages'
}

export interface DoctorAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  medicalReportId?: string; // Linked medical report
}

export interface MedicalReport {
  id: string;
  patientId: string;
  title: string;
  date: string; // YYYY-MM-DD
  reportText: string; // Structured text content/OCR output of the report
  extractedMedications?: string[]; // Medication names detected in report
  findings?: string; // Summary findings
  doctorName?: string; // Creator doctor if any
  attachmentName?: string; // Mock attachment filename
  createdAt: string;
}

// Role based data types
export type UserRole = 'patient' | 'doctor' | 'admin';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  isVerified: boolean;
  hospital: string;
  password?: string;
  status?: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  phone?: string;
  consultationHours?: string;
  biography?: string;
  room?: string;
  isOnline?: boolean;           // Online / Offline availability status
  notificationsEnabled?: boolean; // Notification preferences
  profilePhoto?: string;         // Avatar/photo URL or initials override
}

export interface ConsentRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  patientEmail: string;
  status: 'pending' | 'approved' | 'declined';
  requestDate: string;
  approvedDate?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  userEmail: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  hipaaCompliant: boolean;
  details: string;
}

export interface SafetyFinding {
  severity: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  medication1?: string;
  medication2?: string;
  type: 'interaction' | 'allergy' | 'contraindication' | 'duplicate' | 'dosage' | 'food' | 'timing' | 'organ_warning';
  explanation: string;
  recommendation: string;
  reference: string;
}

export interface SafetyReport {
  overallSeverity: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
  findings: SafetyFinding[];
  generatedAt: string;
  referencedSources: string[];
}

