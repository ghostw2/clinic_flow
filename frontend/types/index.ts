export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
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
  appointments?: Appointment[];
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
