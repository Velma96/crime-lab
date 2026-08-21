const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("beacon_token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // empty response body (e.g. 204 delete)
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  API_URL,
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  adminLogin: (payload) => request("/auth/admin-login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),

  listReports: (status) => request(`/reports${status ? `?status=${status}` : ""}`),
  getReport: (id) => request(`/reports/${id}`),
  createReport: (formData) => request("/reports", { method: "POST", body: formData, isForm: true }),
  updateStatus: (id, status) => request(`/reports/${id}/status`, { method: "PATCH", body: { status } }),
  sendMessage: (id, text) => request(`/reports/${id}/messages`, { method: "POST", body: { text } }),
  markSeen: (id) => request(`/reports/${id}/seen`, { method: "POST" }),

  listBulletins: () => request("/bulletins"),
  createBulletin: (payload) => request("/bulletins", { method: "POST", body: payload }),
  updateBulletin: (id, payload) => request(`/bulletins/${id}`, { method: "PUT", body: payload }),
  deleteBulletin: (id) => request(`/bulletins/${id}`, { method: "DELETE" }),
};

export function setToken(token) {
  if (token) localStorage.setItem("beacon_token", token);
  else localStorage.removeItem("beacon_token");
}

export function getStoredToken() {
  return getToken();
}
