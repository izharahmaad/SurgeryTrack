export type UserRole = 'super_admin' | 'admin' | 'receptionist' | 'doctor' | 'nurse' | 'family';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  hospitalId?: string;
  phoneNumber?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SurgeryStatus =
  | 'scheduled'
  | 'pre_op'
  | 'in_surgery'
  | 'recovery'
  | 'completed'
  | 'cancelled'
  | 'emergency';

export interface SurgeryOperation {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  doctorName: string;
  department: string;
  operationType: string;
  operationDescription?: string;
  otRoom: string;
  hospitalId: string;
  scheduledDate: Date;
  startTime?: Date;
  estimatedEndTime?: Date;
  actualEndTime?: Date;
  status: SurgeryStatus;
  qrCodeData: string;
  familyPhoneNumbers: string[];
  familyNotificationTokens: string[];
  anesthesiaType?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'status_update' | 'reminder' | 'system' | 'emergency';
  surgeryId?: string;
  read: boolean;
  createdAt: Date;
}