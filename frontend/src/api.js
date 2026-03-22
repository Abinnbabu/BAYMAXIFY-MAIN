/* ─────────────────────────────────────────────────────────────────
   src/api.js
   Central API helper — used by every React page/component
   Place this file at: frontend/src/api.js
───────────────────────────────────────────────────────────────── */

const BASE = "http://localhost:5000/api";

/* ── Token helpers ─────────────────────────────────────────────── */
export const getToken = () => localStorage.getItem("token");
export const getUser  = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};
export const saveSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/* ── Shared fetch helper ───────────────────────────────────────── */
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch (e) {
    throw new Error(
      "Cannot reach the server. Is the backend running on port 5000?"
    );
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/* ══════════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════════ */

/** Register a new user. Returns { token, user } */
export async function register(name, email, password) {
  const data = await request("/auth/register", {
    method: "POST",
    body:   JSON.stringify({ name, email, password }),
  });
  saveSession(data.token, data.user);
  return data;
}

/** Login. Returns { token, user } */
export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body:   JSON.stringify({ email, password }),
  });
  saveSession(data.token, data.user);
  return data;
}

/** Logout — clears local storage */
export function logout() {
  clearSession();
}

/* ══════════════════════════════════════════════════════════════════
   CHATBOT (Gemini powered)
══════════════════════════════════════════════════════════════════ */

/** Send a chat message to Baymax. Returns { reply, sessionId } */
export async function sendChatMessage(message, sessionId = null) {
  return request("/chat/message", {
    method: "POST",
    body:   JSON.stringify({ message, sessionId }),
  });
}

/** Get all past chat sessions for the user */
export async function getChatSessions() {
  return request("/chat/sessions");
}

/** Load full message history for one session */
export async function getChatSession(sessionId) {
  return request(`/chat/sessions/${sessionId}`);
}

/** Delete a chat session */
export async function deleteChatSession(sessionId) {
  return request(`/chat/sessions/${sessionId}`, { method: "DELETE" });
}

/* ══════════════════════════════════════════════════════════════════
   SURVEY / CHECK-IN
══════════════════════════════════════════════════════════════════ */

/**
 * Submit the wellness survey.
 * Returns { severity, summary, consultType, urgency, doctors, checkInId }
 */
export async function submitSurvey({ emotions, trigger, intensity, impact, notes }) {
  return request("/survey/checkin", {
    method: "POST",
    body:   JSON.stringify({ emotions, trigger, intensity, impact, notes }),
  });
}

/** Get the user's last 10 survey check-ins (for profile/dashboard) */
export async function getSurveyHistory() {
  return request("/survey/history");
}

/* ══════════════════════════════════════════════════════════════════
   DOCTORS
══════════════════════════════════════════════════════════════════ */

/** List all active doctors */
export async function getDoctors() {
  return request("/doctors");
}

/** Doctor: get their own profile */
export async function getMyDoctorProfile() {
  return request("/doctors/me");
}

/** Doctor: get online (waiting/in-session) appointments */
export async function getDoctorOnlineAppointments() {
  return request("/doctors/appointments/online");
}

/** Doctor: get offline scheduled appointments */
export async function getDoctorOfflineAppointments() {
  return request("/doctors/appointments/offline");
}

/** Doctor: update appointment status */
export async function updateAppointmentStatus(appointmentId, status) {
  return request(`/doctors/appointments/${appointmentId}/status`, {
    method: "PATCH",
    body:   JSON.stringify({ status }),
  });
}

/* ══════════════════════════════════════════════════════════════════
   APPOINTMENTS
══════════════════════════════════════════════════════════════════ */

/** Book an appointment. Body: { doctorName, specialty, type, date, time } */
export async function bookAppointment({ doctorName, specialty, type, date, time }) {
  return request("/appointments/request", {
    method: "POST",
    body:   JSON.stringify({ doctorName, specialty, type, date, time }),
  });
}

/** User: get their own appointments */
export async function getMyAppointments() {
  return request("/appointments/my");
}

/* ══════════════════════════════════════════════════════════════════
   PRESCRIPTIONS
══════════════════════════════════════════════════════════════════ */

/** User: get all their prescriptions */
export async function getMyPrescriptions() {
  return request("/prescriptions/my");
}

/** Get a single prescription by ID */
export async function getPrescription(id) {
  return request(`/prescriptions/${id}`);
}

/**
 * Download prescription as PDF.
 * Directly triggers browser download.
 */
export async function downloadPrescriptionPDF(id) {
  const token = getToken();
  const res   = await fetch(`${BASE}/prescriptions/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("PDF download failed");
  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `prescription-${id}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/** Doctor: write a prescription for a patient */
export async function writePrescription({ patientId, diagnosis, medicines, remark }) {
  return request("/prescriptions", {
    method: "POST",
    body:   JSON.stringify({ patientId, diagnosis, medicines, remark }),
  });
}

/** Doctor: see all prescriptions they wrote */
export async function getDoctorPrescriptions() {
  return request("/prescriptions/doctor/my-patients");
}

/* ══════════════════════════════════════════════════════════════════
   MEDICINES
══════════════════════════════════════════════════════════════════ */

/** List all medicines */
export async function getMedicines() {
  return request("/medicines");
}

/* ══════════════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════════════ */

/**
 * Add items to cart / place order.
 * items: [{ medicineId, qty }]
 */
export async function addToCart(items) {
  return request("/cart/add", {
    method: "POST",
    body:   JSON.stringify({ items }),
  });
}

/** Get the user's past cart orders */
export async function getMyOrders() {
  return request("/cart/my-orders");
}

/* ══════════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════════ */

/**
 * Get full profile + wellness dashboard data.
 * Returns { user, latestSurvey, surveyHistory, appointments, prescriptions, chatCount }
 */
export async function getMyProfile() {
  return request("/profile/me");
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════════════════ */

/* -- Doctors -- */
export async function adminGetDoctors()             { return request("/admin/doctors"); }
export async function adminAddDoctor(data)          { return request("/admin/doctors",        { method: "POST",   body: JSON.stringify(data) }); }
export async function adminUpdateDoctor(id, data)   { return request(`/admin/doctors/${id}`,  { method: "PUT",    body: JSON.stringify(data) }); }
export async function adminToggleDoctorStatus(id, status) {
  return request(`/admin/doctors/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
export async function adminDeleteDoctor(id)         { return request(`/admin/doctors/${id}`,  { method: "DELETE" }); }

/* -- Medicines -- */
export async function adminGetMedicines()           { return request("/admin/medicines"); }
export async function adminAddMedicine(data)        { return request("/admin/medicines",       { method: "POST",   body: JSON.stringify(data) }); }
export async function adminUpdateMedicine(id, data) { return request(`/admin/medicines/${id}`, { method: "PUT",    body: JSON.stringify(data) }); }
export async function adminDeleteMedicine(id)       { return request(`/admin/medicines/${id}`, { method: "DELETE" }); }

/* -- Users -- */
export async function adminGetUsers()               { return request("/admin/users"); }
export async function adminChangeUserRole(id, role) {
  return request(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
}
