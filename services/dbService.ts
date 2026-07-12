
import { supabase } from './supabaseClient';
import { Medication, AdherenceRecord, HealthLog, UserProfile, MedicalReport, Conversation, DirectMessage, ConnectionRequest, MedicalHistoryEntry } from '../types';

/**
 * Service to handle data persistence with Supabase.
 * World-class implementation: Local-first with intelligent merging and fail-safe network handling.
 */
export const dbService = {
  activeEmail: localStorage.getItem('health_ai_active_email') || 'anonymous',

  async isServerOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const { error } = await supabase.from('medications').select('id').limit(1).abortSignal(controller.signal);
      clearTimeout(timeoutId);
      return !error;
    } catch {
      return false;
    }
  },

  async clearActiveUser() {
    try {
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    
    this.activeEmail = 'anonymous';
    localStorage.removeItem('health_ai_active_email');
  },

  // --- Auth Methods ---
  
  async signUp(name: string, email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (error) throw error;
      
      if (data.user) {
        this.activeEmail = email;
        localStorage.setItem('health_ai_active_email', email);
        return { status: "success", user: { name, email, id: data.user.id } };
      }
      throw new Error("Registration failed.");
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.name === 'TypeError') throw new Error("CONNECTION_ERROR");
      throw err;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const name = data.user.user_metadata?.full_name || email.split('@')[0];
        this.activeEmail = email;
        localStorage.setItem('health_ai_active_email', email);
        return { status: "success", user: { name, email, id: data.user.id } };
      }
      throw new Error("Invalid login.");
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.name === 'TypeError') throw new Error("CONNECTION_ERROR");
      throw err;
    }
  },

  async sendEmail(subject: string, body: string, toEmail: string): Promise<boolean> {
    console.debug(`[MOCK EMAIL] To: ${toEmail} | Subject: ${subject}`);
    return true;
  },

  // --- Data Methods with Intelligent Merging ---

  async getMedications(): Promise<Medication[]> {
    const local = this.getLocal('medications', []);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return local;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return local;

      const { data: server, error } = await supabase.from('medications').select('*');
      if (error) throw error;

      if (server) {
        // Merge logic: Server is authority, but don't drop local items that haven't synced yet
        const serverIds = new Set(server.map(s => s.id));
        const merged = [
          ...server,
          ...local.filter(l => !serverIds.has(l.id))
        ];
        this.setLocal('medications', merged);
        return merged;
      }
      return local;
    } catch (err) {
      console.warn("Using offline medications cache.");
      return local;
    }
  },

  async saveMedications(meds: Medication[]): Promise<void> {
    this.setLocal('medications', meds);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      await supabase.from('medications').upsert(meds);
    } catch (err) {
      console.warn("Medication sync deferred until back online.");
    }
  },

  async getAdherence(): Promise<AdherenceRecord[]> {
    const local = this.getLocal('adherence', []);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return local;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return local;

      const { data: server, error } = await supabase.from('adherence').select('*');
      if (error) throw error;

      if (server) {
        const merged = this.mergeRecords(local, server);
        this.setLocal('adherence', merged);
        return merged;
      }
      return local;
    } catch (err) {
      return local;
    }
  },

  async saveAdherence(records: AdherenceRecord[]): Promise<void> {
    this.setLocal('adherence', records);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      await supabase.from('adherence').upsert(records);
    } catch (err) {}
  },

  async getLogs(): Promise<HealthLog[]> {
    const local = this.getLocal('health_logs', []);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return local;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return local;

      const { data: server, error } = await supabase.from('health_logs').select('*');
      if (error) throw error;

      if (server) {
        const serverIds = new Set(server.map(s => s.id));
        const merged = [...server, ...local.filter(l => !serverIds.has(l.id))];
        this.setLocal('health_logs', merged);
        return merged;
      }
      return local;
    } catch (err) {
      return local;
    }
  },

  async saveLogs(logs: HealthLog[]): Promise<void> {
    this.setLocal('health_logs', logs);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      await supabase.from('health_logs').upsert(logs);
    } catch (err) {}
  },

  async getMedicalReports(): Promise<MedicalReport[]> {
    const local = this.getLocal('medical_reports', []);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return local;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return local;

      const { data: server, error } = await supabase.from('medical_reports').select('*');
      if (error) throw error;

      if (server) {
        const serverIds = new Set(server.map(s => s.id));
        const merged = [...server, ...local.filter(l => !serverIds.has(l.id))];
        this.setLocal('medical_reports', merged);
        return merged;
      }
      return local;
    } catch (err) {
      return local;
    }
  },

  async saveMedicalReports(reports: MedicalReport[]): Promise<void> {
    this.setLocal('medical_reports', reports);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      await supabase.from('medical_reports').upsert(reports);
    } catch (err) {}
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const local = this.getLocal('user_profile', null);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return local;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return local;

      const { data: server, error } = await supabase.from('profiles').select('*').maybeSingle();
      if (error) throw error;
      if (server) {
        this.setLocal('user_profile', server);
        return server;
      }
      return local;
    } catch (err) {
      return local;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    this.setLocal('user_profile', profile);
    if (!this.activeEmail || this.activeEmail === 'anonymous') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      await supabase.from('profiles').upsert(profile);
    } catch (err) {}
  },

  // Helper to merge adherence records (unique by date + medId)
  mergeRecords(local: AdherenceRecord[], server: AdherenceRecord[]): AdherenceRecord[] {
    const map = new Map();
    [...server, ...local].forEach(r => {
      const key = `${r.date}-${r.medicationId}`;
      map.set(key, r);
    });
    return Array.from(map.values());
  },

  getLocal(key: string, defaultValue: any) {
    try {
      const email = this.activeEmail || 'anonymous';
      const stored = localStorage.getItem(`health_ai_cache_${email}_${key}`);
      return (stored && stored !== 'undefined') ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setLocal(key: string, value: any) {
    try {
      const email = this.activeEmail || 'anonymous';
      localStorage.setItem(`health_ai_cache_${email}_${key}`, JSON.stringify(value));
    } catch {}
  },

  async resetAll() {
    await this.clearActiveUser();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('health_ai')) {
        localStorage.removeItem(key);
      }
    });
  },

  // ---- Messaging & Connection Helpers ----

  getConversations(): Conversation[] {
    const cached = this.getLocal('conversations', null);
    if (cached && cached.length > 0) return cached;
    // Seed demo conversation
    return [
      {
        id: 'conv-demo-1',
        patientId: 'patient-1',
        patientName: 'Jane Doe',
        doctorId: 'doc-101',
        doctorName: 'Dr. Elizabeth Blackwell',
        doctorSpecialty: 'Internal Medicine',
        status: 'active',
        unreadCountPatient: 1,
        unreadCountDoctor: 0,
        lastMessageAt: new Date().toISOString()
      }
    ];
  },

  saveConversations(convs: Conversation[]): void {
    this.setLocal('conversations', convs);
  },

  getMessages(conversationId: string): DirectMessage[] {
    const cached = this.getLocal(`messages_${conversationId}`, null);
    if (cached) return cached;
    
    if (conversationId === 'conv-demo-1') {
      return [
        {
          id: 'msg-1',
          conversationId: 'conv-demo-1',
          senderId: 'doc-101',
          senderType: 'doctor',
          content: 'Hello Jane, I reviewed your latest blood pressure logs. The Amlodipine seems to be working well.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true
        },
        {
          id: 'msg-2',
          conversationId: 'conv-demo-1',
          senderId: 'patient-1',
          senderType: 'patient',
          content: 'Thank you doctor! Yes, I feel much better this week. Should I continue the same dosage?',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isRead: true
        },
        {
          id: 'msg-3',
          conversationId: 'conv-demo-1',
          senderId: 'doc-101',
          senderType: 'doctor',
          content: 'Yes, please continue the 5mg daily dosage. We will do another checkup next month.',
          timestamp: new Date().toISOString(),
          isRead: false
        }
      ];
    }
    return [];
  },

  saveMessages(conversationId: string, messages: DirectMessage[]): void {
    this.setLocal(`messages_${conversationId}`, messages);
  },

  getConnectionRequests(): ConnectionRequest[] {
    return this.getLocal('connection_requests', []);
  },

  saveConnectionRequests(requests: ConnectionRequest[]): void {
    this.setLocal('connection_requests', requests);
  },

  // ---- Medical History Helpers ----

  getMedicalHistory(patientId: string): MedicalHistoryEntry[] {
    return this.getLocal(`medical_history_${patientId}`, []);
  },

  saveMedicalHistory(patientId: string, entries: MedicalHistoryEntry[]): void {
    this.setLocal(`medical_history_${patientId}`, entries);
  }
};
