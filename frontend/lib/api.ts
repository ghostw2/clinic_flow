import axios from "axios";
import type {
  LoginResponse,
  TwoFASetupResponse,
  Appointment,
  Patient,
  PaginatedPatients,
  User,
  DashboardStats,
  MedicalRecord,
  PatientHistory,
  VitalSigns,
} from "@/types";

// All requests go through Next.js proxy (/api/* → backend), keeping cookies same-origin
const api = axios.create({ baseURL: "/api" });

// Unwrap the standard { success, data } envelope and handle 401 globally.
const PUBLIC_PATHS = ["/login", "/verify-2fa"];
api.interceptors.response.use(
  (r) => {
    if (r.data && typeof r.data === "object" && r.data.success === true && "data" in r.data) {
      r.data = r.data.data;
    }
    return r;
  },
  (err) => {
    const is401 = err.response?.status === 401;
    const isAuthCheck = err.config?.url === "/auth/me";
    const onPublicPage =
      typeof window !== "undefined" &&
      PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));

    if (is401 && !isAuthCheck && !onPublicPage && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  me: () => api.get<User>("/auth/me"),

  setup2FA: () => api.post<TwoFASetupResponse>("/auth/2fa/setup"),
  enable2FA: (code: string) => api.post("/auth/2fa/enable", { code }),
  verify2FA: (pre_auth_token: string, code: string) =>
    api.post<{ user: User }>("/auth/2fa/verify", { pre_auth_token, code }),
  disable2FA: (code: string) => api.post("/auth/2fa/disable", { code }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentsApi = {
  list: (params?: { date?: string; status?: string; doctor_id?: string }) =>
    api.get<Appointment[]>("/appointments", { params }),

  create: (data: {
    patient_id: string;
    doctor_id: string;
    datetime: string;
    duration?: number;
    notes?: string;
  }) => api.post<Appointment>("/appointments", data),

  update: (
    id: string,
    data: Partial<{
      doctor_id: string;
      datetime: string;
      duration: number;
      status: string;
      notes: string;
    }>
  ) => api.put<Appointment>(`/appointments/${id}`, data),

  remove: (id: string) => api.delete(`/appointments/${id}`),
};

// ── Patients ──────────────────────────────────────────────────────────────────
type PatientPayload = Partial<{
  name: string;
  dob: string;
  phone: string;
  email: string;
  notes: string;
  gender: string;
  blood_type: string;
  allergies: string;
  chronic_conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  insurance: string;
  occupation: string;
}>;

export const patientsApi = {
  list: (params?: { search?: string; page?: number }) =>
    api.get<PaginatedPatients>("/patients", { params }),

  get: (id: string) => api.get<Patient>(`/patients/${id}`),

  history: (id: string) => api.get<PatientHistory>(`/patients/${id}/history`),

  create: (data: PatientPayload & { name: string }) =>
    api.post<Patient>("/patients", data),

  update: (id: string, data: PatientPayload) =>
    api.put<Patient>(`/patients/${id}`, data),

  remove: (id: string) => api.delete(`/patients/${id}`),
};

// ── Medical Records ───────────────────────────────────────────────────────────
type RecordPayload = {
  appointment_id?: string;
  doctor_id: string;
  visit_date?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string;
  vital_signs?: VitalSigns;
  follow_up_date?: string;
  notes?: string;
};

export const medicalRecordsApi = {
  list: (patientId: string) =>
    api.get<{ records: MedicalRecord[] }>(`/patients/${patientId}/records`),

  create: (patientId: string, data: RecordPayload) =>
    api.post<MedicalRecord>(`/patients/${patientId}/records`, data),

  update: (patientId: string, recordId: string, data: Partial<Omit<RecordPayload, "doctor_id">>) =>
    api.put<MedicalRecord>(`/patients/${patientId}/records/${recordId}`, data),

  remove: (patientId: string, recordId: string) =>
    api.delete(`/patients/${patientId}/records/${recordId}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<User[]>("/users"),

  create: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => api.post<User>("/users", data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  send: (appointment_id: string, type: "email" | "sms") =>
    api.post("/notifications/send", { appointment_id, type }),
};

export default api;
