import { Doctor } from '../types';
import { dbService } from './dbService';

export interface DoctorNotification {
  id: string;
  doctorId: string;
  message: string;
  type: 'approval' | 'rejection' | 'general';
  timestamp: string;
  read: boolean;
}

/**
 * DoctorApprovalService
 * Manages the review workflow, record updates, and notification delivery
 * for healthcare practitioners registered on the platform.
 */
export const DoctorApprovalService = {
  /**
   * Retrieves notifications list for a specific doctor by email.
   */
  getNotifications(doctorEmail: string): DoctorNotification[] {
    if (!doctorEmail) return [];
    const key = `doctor_notifications_${doctorEmail.toLowerCase()}`;
    return dbService.getLocal(key, []);
  },

  /**
   * Adds a new verification-related notification for a doctor.
   */
  addNotification(doctorEmail: string, notification: Omit<DoctorNotification, 'id' | 'timestamp' | 'read'>): DoctorNotification {
    const key = `doctor_notifications_${doctorEmail.toLowerCase()}`;
    const notifications = this.getNotifications(doctorEmail);
    const newNotif: DoctorNotification = {
      ...notification,
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      read: false
    };
    dbService.setLocal(key, [newNotif, ...notifications]);
    return newNotif;
  },

  /**
   * Marks all notifications for a doctor as read.
   */
  markAsRead(doctorEmail: string): void {
    if (!doctorEmail) return;
    const key = `doctor_notifications_${doctorEmail.toLowerCase()}`;
    const notifications = this.getNotifications(doctorEmail);
    const updated = notifications.map(n => ({ ...n, read: true }));
    dbService.setLocal(key, updated);
  },

  /**
   * Clears all notifications for a doctor.
   */
  clearNotifications(doctorEmail: string): void {
    if (!doctorEmail) return;
    const key = `doctor_notifications_${doctorEmail.toLowerCase()}`;
    dbService.setLocal(key, []);
  },

  /**
   * Verifies a doctor, updates their status, and creates a verification notification.
   */
  verifyDoctor(doctorId: string, doctorsList: Doctor[]): { updatedDoctors: Doctor[]; doctor: Doctor | null } {
    const doctor = doctorsList.find(d => d.id === doctorId);
    const updatedDoctors = doctorsList.map(doc => {
      if (doc.id === doctorId) {
        return { ...doc, isVerified: true, status: 'verified' as const, rejectionReason: undefined };
      }
      return doc;
    });

    if (doctor) {
      this.addNotification(doctor.email, {
        doctorId: doctor.id,
        message: `Congratulations ${doctor.name}! Your clinical credentials and medical registry details have been successfully verified by our compliance review team. Your doctor account is now fully active.`,
        type: 'approval'
      });
    }

    return { updatedDoctors, doctor };
  },

  /**
   * Rejects a doctor, updates their status and rejection reason, and creates a rejection notification.
   */
  rejectDoctor(doctorId: string, reason: string, doctorsList: Doctor[]): { updatedDoctors: Doctor[]; doctor: Doctor | null } {
    const doctor = doctorsList.find(d => d.id === doctorId);
    const updatedDoctors = doctorsList.map(doc => {
      if (doc.id === doctorId) {
        return { ...doc, isVerified: false, status: 'rejected' as const, rejectionReason: reason };
      }
      return doc;
    });

    if (doctor) {
      this.addNotification(doctor.email, {
        doctorId: doctor.id,
        message: `Your medical licensing credentials registry application was rejected. Review feedback: "${reason}". Please verify and re-submit your registration request.`,
        type: 'rejection'
      });
    }

    return { updatedDoctors, doctor };
  }
};
