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
  clinic_id: string;
  role: UserRole;
  name: string;
  email: string;
  two_factor_enabled: boolean;
  two_factor_verified: boolean;
  created_at: string;
  clinic?: Clinic;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  dob?: string;
  phone: string;
  email: string;
  notes: string;
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
  clinic_id: string;
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
  patient: Patient;
  records: MedicalRecord[];
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  datetime: string;
  duration: number;
  status: AppointmentStatus;
  notes: string;
  created_at: string;
  patient?: Patient;
  doctor?: User;
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
