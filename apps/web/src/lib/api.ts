import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

// User API
export const userApi = {
  getMe: () => api.get("/me"),
  updateMe: (data: Record<string, unknown>) => api.patch("/me", data),
};

// Resource API
export const resourceApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/resources", { params }),

  getById: (id: string) => api.get(`/resources/${id}`),

  create: (data: Record<string, unknown>) => api.post("/resources", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/resources/${id}`, data),

  delete: (id: string) => api.delete(`/resources/${id}`),

  download: (id: string) => api.get(`/resources/${id}/download`),
};

// Bookmark API
export const bookmarkApi = {
  add: (resourceId: string) =>
    api.post(`/resources/${resourceId}/bookmark`),

  remove: (resourceId: string) =>
    api.delete(`/resources/${resourceId}/bookmark`),

  list: (params?: Record<string, unknown>) =>
    api.get("/resources/bookmarks", { params }),
};

// Collection API
export const collectionApi = {
  list: () => api.get("/collections"),

  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post("/collections", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/collections/${id}`, data),

  delete: (id: string) => api.delete(`/collections/${id}`),

  addItem: (id: string, data: { resourceId: string; note?: string }) =>
    api.post(`/collections/${id}/items`, data),

  removeItem: (id: string, resourceId: string) =>
    api.delete(`/collections/${id}/items/${resourceId}`),
};

// Rating API
export const ratingApi = {
  add: (resourceId: string, data: { score: number; comment?: string }) =>
    api.post(`/resources/${resourceId}/rating`, data),

  update: (resourceId: string, data: { score: number; comment?: string }) =>
    api.patch(`/resources/${resourceId}/rating`, data),

  remove: (resourceId: string) =>
    api.delete(`/resources/${resourceId}/rating`),
};

// Report API
export const reportApi = {
  create: (
    resourceId: string,
    data: { reason: string; description?: string }
  ) => api.post(`/resources/${resourceId}/report`, data),
};

// Share API
export const shareApi = {
  create: (resourceId: string) =>
    api.post(`/resources/${resourceId}/share`),

  getByCode: (code: string) => api.get(`/shared/${code}`),
};

// Admin API
export const adminApi = {
  // Users
  listUsers: (params?: Record<string, unknown>) =>
    api.get("/admin/users", { params }),

  createUser: (data: Record<string, unknown>) =>
    api.post("/admin/users", data),

  updateUser: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${id}`, data),

  activateUser: (id: string) =>
    api.post(`/admin/users/${id}/activate`),

  deactivateUser: (id: string) =>
    api.post(`/admin/users/${id}/deactivate`),

  // Moderation
  listPending: (params?: Record<string, unknown>) =>
    api.get("/resources/moderation", { params }),

  approve: (id: string) => api.post(`/resources/${id}/approve`),

  reject: (id: string, data: { reason: string }) =>
    api.post(`/resources/${id}/reject`, data),

  // Reports
  listReports: (params?: Record<string, unknown>) =>
    api.get("/admin/reports", { params }),

  updateReport: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/reports/${id}`, data),

  // Analytics
  getAnalytics: () => api.get("/admin/analytics"),

  // Academic structure
  listDepartments: () => api.get("/departments"),
  createDepartment: (data: Record<string, unknown>) =>
    api.post("/departments", data),

  listBatches: (params?: Record<string, unknown>) =>
    api.get("/batches", { params }),
  createBatch: (data: Record<string, unknown>) =>
    api.post("/batches", data),

  listSubjects: (params?: Record<string, unknown>) =>
    api.get("/subjects", { params }),
  createSubject: (data: Record<string, unknown>) =>
    api.post("/subjects", data),
};

// Faculty API
export const facultyApi = {
  getMyResources: (params?: Record<string, unknown>) =>
    api.get("/resources/my", { params }),

  getEngagement: (resourceId: string) =>
    api.get(`/resources/${resourceId}/engagement`),

  getBatchEngagement: (batchId: string) =>
    api.get(`/faculty/batches/${batchId}/engagement`),

  getStudents: (params?: Record<string, unknown>) =>
    api.get("/faculty/students", { params }),
};

// Upload API
export const uploadApi = {
  initiate: (data: { fileName: string; fileSize: number; mimeType: string }) =>
    api.post("/uploads/initiate", data),

  complete: (data: { uploadId: string; checksum: string }) =>
    api.post("/uploads/complete", data),
};
