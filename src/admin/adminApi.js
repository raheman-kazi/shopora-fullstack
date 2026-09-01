// =====================================================
// ADMIN API HELPER
// Sab admin requests yahi se jaate hain
// =====================================================

import { API_BASE } from "../config";

export { API_BASE };

const getToken = () => localStorage.getItem("token");

const request = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(
    `${API_BASE}/api/admin${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data.message || "Something went wrong"
    );
    error.status = response.status;
    throw error;
  }

  return data;
};

// Query string banane ke liye
const query = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      search.append(key, value);
    }
  });

  const string = search.toString();
  return string ? `?${string}` : "";
};

export const adminApi = {
  verify: () => request("/verify"),

  // ---------- DASHBOARD ----------
  getStats: () => request("/stats"),

  // ---------- PRODUCTS ----------
  getProducts: (params) =>
    request(`/products${query(params)}`),

  createProduct: (body) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProduct: (id, body) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: "DELETE",
    }),

  // ---------- ORDERS ----------
  getOrders: (params) =>
    request(`/orders${query(params)}`),

  getOrder: (id) => request(`/orders/${id}`),

  updateOrderStatus: (id, body) =>
    request(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // ---------- USERS ----------
  getUsers: (params) =>
    request(`/users${query(params)}`),

  updateUserRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: "DELETE",
    }),
};

// =====================================================
// SMALL FORMAT HELPERS
// =====================================================

export const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const shortDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const dateTime = (value) =>
  new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
