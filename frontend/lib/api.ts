import axios from "axios";
import type {
  LoginResponse,
  TwoFASetupResponse,
  Appointment,
  Patient,
  PaginatedPatients,
  User,
  DashboardStats,
} from "@/types";

// All requests go through Next.js proxy (/api/* → backend), keeping cookies same-origin
const api = axios.create({ baseURL: "/api" });

// Handle 401 globally — redirect to login only from protected pages
const PUBLIC_PATHS = ["/login", "/verify-2fa"];
api.interceptors.response.use(
  (r) => r,
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
export const patientsApi = {
  list: (params?: { search?: string; page?: number }) =>
    api.get<PaginatedPatients>("/patients", { params }),

  get: (id: string) => api.get<Patient>(`/patients/${id}`),

  create: (data: {
    name: string;
    dob?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) => api.post<Patient>("/patients", data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      dob: string;
      phone: string;
      email: string;
      notes: string;
    }>
  ) => api.put<Patient>(`/patients/${id}`, data),

  remove: (id: string) => api.delete(`/patients/${id}`),
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
