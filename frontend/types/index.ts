export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_demo?: boolean;
  subscription_status?: string;
  plan_name?: string;
  created_at: string;
}

export type UserRole = "admin" | "doctor" | "staff";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  two_factor_enabled: boolean;
  created_at: string;
  clinic?: Clinic;
}

export interface Patient {
  id: string;
  name: string;
  dob?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  // Medical profile
  gender?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  insurance?: string;
  occupation?: string;
  consent_given_at?: string;
  consent_notes?: string;
  appointments?: Appointment[];
  medical_records?: MedicalRecord[];
}

export interface VitalSigns {
  blood_pressure?: string;
  temperature?: string;
  heart_rate?: string;
  weight?: string;
  height?: string;
  oxygen_saturation?: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  appointment_id?: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string;
  vital_signs?: VitalSigns;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  doctor?: User;
  appointment?: Appointment;
}

export interface PatientHistory {
  records: MedicalRecord[];
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  datetime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  patient?: Patient;
  doctor?: User;
}

export type DocumentType = "odontogram" | "dicom" | "xray" | "lab" | "report" | "photo" | "other";

export interface AppointmentDocument {
  id: string;
  appointment_id: string;
  clinic_id: string;
  uploaded_by: string;
  original_name: string;
  mime_type: string;
  size: number;
  doc_type: DocumentType;
  created_at: string;
  uploader?: User;
}

export interface DashboardStats {
  today_count: number;
  total_patients: number;
  monthly_count: number;
  pending_count: number;
  upcoming: Appointment[];
}

export interface PaginatedPatients {
  patients: Patient[];
  total: number;
}

export interface AuthResponse {
  user: User;
}

export interface TwoFASetupResponse {
  secret: string;
  qr_code: string;
}

export interface LoginResponse {
  user?: User;
  requires_2fa?: boolean;
  pre_auth_token?: string;
}

export interface ApiError {
  error: string;
}

export type PermissionAction =
  | "appointment.create"
  | "appointment.update"
  | "appointment.update_status"
  | "appointment.delete"
  | "patient.create"
  | "patient.update"
  | "patient.delete"
  | "record.create"
  | "record.update"
  | "record.delete"
  | "document.upload"
  | "document.delete"
  | "treatment.create"
  | "treatment.update"
  | "payment.record";

export type ClinicPermissions = Record<string, PermissionAction[]>;

export type TreatmentStatus = "active" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "paid";
export type PaymentInstallmentStatus = "pending" | "paid" | "overdue";

export interface TreatmentPayment {
  id: string;
  treatment_id: string;
  clinic_id: string;
  amount: number;
  due_date?: string;
  paid_at?: string;
  status: PaymentInstallmentStatus;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  created_by: string;
  name: string;
  description?: string;
  total_amount: number;
  planned_visits: number;
  status: TreatmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  payments?: TreatmentPayment[];
  appointments?: Appointment[];
  amount_paid: number;
  amount_remaining: number;
  payment_status: PaymentStatus;
  visits_used: number;
}

export interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
