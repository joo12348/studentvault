"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { useAuthStore, isAdmin } from "@/lib/auth";
import { Toaster, toast } from "react-hot-toast";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  studentProfile?: { firstName: string; lastName: string };
  facultyProfile?: { firstName: string; lastName: string };
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  resourceType: string;
  status: string;
  uploaderId: string;
  uploader?: { email: string; studentProfile?: { firstName: string; lastName: string }; facultyProfile?: { firstName: string; lastName: string } };
  subject?: { name: string };
  createdAt: string;
}

interface Report {
  id: string;
  reason: string;
  description?: string;
  status: string;
  reporterId: string;
  reporter?: { email: string };
  resourceId: string;
  resource?: { title: string };
  createdAt: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalResources: number;
  totalDownloads: number;
  totalViews: number;
  usersByRole: { role: string; count: number }[];
  resourcesByType: { type: string; count: number }[];
  downloadsOverTime?: { date: string; count: number }[];
  viewsOverTime?: { date: string; count: number }[];
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Batch {
  id: string;
  name: string;
  departmentId: string;
  department?: { name: string };
  startYear: number;
  endYear: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  department?: { name: string };
}

type AdminTab = "users" | "moderation" | "reports" | "analytics" | "academics";

const TABS = [
  { id: "users", label: "Users" },
  { id: "moderation", label: "Moderation" },
  { id: "reports", label: "Reports" },
  { id: "analytics", label: "Analytics" },
  { id: "academics", label: "Academics" },
] as const;

function getInitials(u: User) {
  const fn = u.studentProfile?.firstName || u.facultyProfile?.firstName || "";
  const ln = u.studentProfile?.lastName || u.facultyProfile?.lastName || "";
  const initials = ((fn[0] || "") + (ln[0] || "")).toUpperCase();
  return initials || u.email.slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "badge-success",
    INACTIVE: "badge-neutral",
    SUSPENDED: "badge-error",
    PENDING_VERIFICATION: "badge-warning",
    APPROVED: "badge-success",
    REJECTED: "badge-error",
    PENDING_REVIEW: "badge-warning",
    OPEN: "badge-warning",
    RESOLVED: "badge-success",
    DISMISSED: "badge-neutral",
  };
  return (
    <span className={`badge ${map[status] ?? "badge-neutral"}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [userFilters, setUserFilters] = useState({ role: "", status: "" });

  // Moderation state
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [modLoading, setModLoading] = useState(false);
  const [modPage, setModPage] = useState(1);
  const [modTotalPages, setModTotalPages] = useState(0);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(0);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Academics state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicsLoading, setAcademicsLoading] = useState(false);

  // Form states
  const [newDept, setNewDept] = useState({ name: "", code: "", description: "" });
  const [newBatch, setNewBatch] = useState({ name: "", departmentId: "", startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 4 });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", departmentId: "" });

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user && !isAdmin(user)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  // Load data based on active tab
  useEffect(() => {
    if (user && isAdmin(user)) {
      if (activeTab === "users") loadUsers();
      else if (activeTab === "moderation") loadPending();
      else if (activeTab === "reports") loadReports();
      else if (activeTab === "analytics") loadAnalytics();
      else if (activeTab === "academics") loadAcademics();
    }
  }, [activeTab, user]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminApi.listUsers({ page: usersPage, limit: 20, role: userFilters.role, status: userFilters.status });
      setUsers(res.data.data);
      setUsersTotalPages(res.data.pagination.totalPages);
    } catch { toast.error("Failed to load users"); }
    finally { setUsersLoading(false); }
  };

  const loadPending = async () => {
    setModLoading(true);
    try {
      const res = await adminApi.listPending({ page: modPage, limit: 20, status: "PENDING_REVIEW" });
      setPendingResources(res.data.data);
      setModTotalPages(res.data.pagination.totalPages);
    } catch { toast.error("Failed to load pending resources"); }
    finally { setModLoading(false); }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const res = await adminApi.listReports({ page: reportsPage, limit: 20 });
      setReports(res.data.data);
      setReportsTotalPages(res.data.pagination.totalPages);
    } catch { toast.error("Failed to load reports"); }
    finally { setReportsLoading(false); }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
    } catch { toast.error("Failed to load analytics"); }
    finally { setAnalyticsLoading(false); }
  };

  const loadAcademics = async () => {
    setAcademicsLoading(true);
    try {
      const [depts, batchesRes, subsRes] = await Promise.all([
        adminApi.listDepartments(),
        adminApi.listBatches({ limit: 100 }),
        adminApi.listSubjects({ limit: 100 }),
      ]);
      setDepartments(depts.data.data ?? depts.data);
      setBatches(batchesRes.data.data);
      setSubjects(subsRes.data.data);
    } catch { toast.error("Failed to load academics"); }
    finally { setAcademicsLoading(false); }
  };

  // User actions
  const updateUserStatus = async (id: string, status: string) => {
    try { await adminApi.updateUser(id, { status }); toast.success("Status updated"); loadUsers(); }
    catch { toast.error("Failed to update"); }
  };

  const updateUserRole = async (id: string, role: string) => {
    try { await adminApi.updateUser(id, { role }); toast.success("Role updated"); loadUsers(); }
    catch { toast.error("Failed to update"); }
  };

  const toggleUser = async (id: string, currentStatus: string) => {
    if (currentStatus === "ACTIVE") { await adminApi.deactivateUser(id); }
    else { await adminApi.activateUser(id); }
    toast.success("User status changed"); loadUsers();
  };

  // Moderation actions
  const approveResource = async (id: string) => {
    try { await adminApi.approve(id); toast.success("Approved"); loadPending(); }
    catch { toast.error("Failed to approve"); }
  };

  const rejectResource = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try { await adminApi.reject(id, { reason }); toast.success("Rejected"); loadPending(); }
    catch { toast.error("Failed to reject"); }
  };

  // Academic creation
  const createDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) { toast.error("Name and code required"); return; }
    try { await adminApi.createDepartment(newDept); toast.success("Department created"); setNewDept({ name: "", code: "", description: "" }); loadAcademics(); }
    catch { toast.error("Failed to create"); }
  };

  const createBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.departmentId) { toast.error("Name and department required"); return; }
    try { await adminApi.createBatch(newBatch); toast.success("Batch created"); setNewBatch({ name: "", departmentId: "", startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 4 }); loadAcademics(); }
    catch { toast.error("Failed to create"); }
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code || !newSubject.departmentId) { toast.error("All fields required"); return; }
    try { await adminApi.createSubject(newSubject); toast.success("Subject created"); setNewSubject({ name: "", code: "", departmentId: "" }); loadAcademics(); }
    catch { toast.error("Failed to create"); }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin(user)) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-[rgb(var(--text-secondary))]">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">System administration</p>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={userFilters.role}
              onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
              className="input max-w-[180px]"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={userFilters.status}
              onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
              className="input max-w-[200px]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending</option>
            </select>
            <button
              onClick={() => { setUserFilters({ role: "", status: "" }); loadUsers(); }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>

          {usersLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(u)}
                            </div>
                            <span className="font-medium">
                              {u.studentProfile?.firstName || u.facultyProfile?.firstName || "—"}
                              {u.studentProfile?.lastName || u.facultyProfile?.lastName ? ` ${u.studentProfile?.lastName || u.facultyProfile?.lastName}` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="text-[rgb(var(--text-secondary))]">{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] px-2 py-1 text-xs"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={u.status}
                            onChange={(e) => updateUserStatus(u.id, e.target.value)}
                            className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] px-2 py-1 text-xs"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="PENDING_VERIFICATION">Pending</option>
                          </select>
                        </td>
                        <td>
                          {u.emailVerified ? (
                            <span className="text-[rgb(var(--color-success))] font-medium">✓</span>
                          ) : (
                            <span className="text-[rgb(var(--color-error))] font-medium">✗</span>
                          )}
                        </td>
                        <td className="text-xs text-[rgb(var(--text-secondary))]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => toggleUser(u.id, u.status)}
                            className="rounded-lg border border-[rgb(var(--border-primary))] px-2.5 py-1 text-xs hover:bg-[rgb(var(--bg-hover))] transition-colors"
                          >
                            {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {usersTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setUsersPage((p) => Math.max(1, p - 1)); loadUsers(); }}
                    disabled={usersPage <= 1 || usersLoading}
                    className="rounded-lg border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >Prev</button>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">Page {usersPage} of {usersTotalPages}</span>
                  <button
                    onClick={() => { setUsersPage((p) => p + 1); loadUsers(); }}
                    disabled={usersPage >= usersTotalPages || usersLoading}
                    className="rounded-lg border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Moderation Tab */}
      {activeTab === "moderation" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Pending Resources</h2>

          {modLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : pendingResources.length === 0 ? (
            <p className="text-[rgb(var(--text-secondary))]">No pending resources.</p>
          ) : (
            <div className="space-y-3">
              {pendingResources.map((r) => (
                <div key={r.id} className="card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.title}</p>
                    <p className="text-xs text-[rgb(var(--text-secondary))]">
                      {r.resourceType} · by {r.uploader?.email || "unknown"} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    {r.subject && <p className="text-xs text-[rgb(var(--text-secondary))]">Subject: {r.subject.name}</p>}
                    {r.description && <p className="mt-1 text-sm line-clamp-2">{r.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => approveResource(r.id)} className="btn-primary bg-[rgb(var(--color-success))] hover:bg-[rgb(42,164,74)] px-4 py-2">
                      Approve
                    </button>
                    <button onClick={() => rejectResource(r.id)} className="btn-danger px-4 py-2">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {modTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => { setModPage((p) => Math.max(1, p - 1)); loadPending(); }}
                disabled={modPage <= 1 || modLoading}
                className="rounded-lg border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >Prev</button>
              <span className="text-sm text-[rgb(var(--text-secondary))]">Page {modPage} of {modTotalPages}</span>
              <button
                onClick={() => { setModPage((p) => p + 1); loadPending(); }}
                disabled={modPage >= modTotalPages || modLoading}
                className="rounded-lg border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Reports</h2>

          {reportsLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : reports.length === 0 ? (
            <p className="text-[rgb(var(--text-secondary))]">No reports.</p>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Reporter</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td className="font-medium">{r.resource?.title || "—"}</td>
                        <td className="text-[rgb(var(--text-secondary))]">{r.reporter?.email || "—"}</td>
                        <td>{r.reason}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-xs text-[rgb(var(--text-secondary))]">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportsTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button onClick={() => { setReportsPage((p) => Math.max(1, p - 1)); loadReports(); }} disabled={reportsPage <= 1 || reportsLoading} className="rounded-lg border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Prev</button>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">Page {reportsPage} of {reportsTotalPages}</span>
                  <button onClick={() => { setReportsPage((p) => p + 1); loadReports(); }} disabled={reportsPage >= reportsTotalPages || reportsLoading} className="rounded-lg border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Analytics</h2>

          {analyticsLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : analytics ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-card-value">{analytics.totalUsers}</p>
                      <p className="stat-card-label">Total Users</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-card-value">{analytics.totalResources}</p>
                      <p className="stat-card-label">Total Resources</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-card-value">{analytics.totalDownloads}</p>
                      <p className="stat-card-label">Total Downloads</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-card-value">{analytics.totalViews}</p>
                      <p className="stat-card-label">Total Views</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card p-5">
                  <h3 className="mb-3 font-semibold">Users by Role</h3>
                  <ul className="space-y-2">
                    {analytics.usersByRole?.map((r) => (
                      <li key={r.role} className="flex justify-between text-sm">
                        <span className="text-[rgb(var(--text-secondary))]">{r.role}</span>
                        <span className="font-medium">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card p-5">
                  <h3 className="mb-3 font-semibold">Resources by Type</h3>
                  <ul className="space-y-2">
                    {analytics.resourcesByType?.map((r) => (
                      <li key={r.type} className="flex justify-between text-sm">
                        <span className="text-[rgb(var(--text-secondary))]">{r.type}</span>
                        <span className="font-medium">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[rgb(var(--text-secondary))]">Loading analytics...</p>
          )}
        </div>
      )}

      {/* Academics Tab */}
      {activeTab === "academics" && (
        <div>
          {academicsLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Departments */}
              <div className="card p-5">
                <h3 className="mb-3 font-semibold flex items-center justify-between">
                  Departments
                  <span className="text-sm text-[rgb(var(--text-secondary))]">{departments.length}</span>
                </h3>
                <form onSubmit={createDept} className="mb-4 space-y-2">
                  <input value={newDept.name} onChange={(e) => setNewDept({...newDept, name: e.target.value})} placeholder="Name" className="input" />
                  <input value={newDept.code} onChange={(e) => setNewDept({...newDept, code: e.target.value})} placeholder="Code (e.g., CS)" className="input" maxLength={10} />
                  <input value={newDept.description} onChange={(e) => setNewDept({...newDept, description: e.target.value})} placeholder="Description" className="input" />
                  <button type="submit" className="btn-primary w-full">Add</button>
                </form>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {departments.map((d) => (
                    <li key={d.id} className="text-sm flex justify-between p-2 rounded-lg border border-[rgb(var(--border-secondary))]">
                      <span>{d.name} ({d.code})</span>
                      <span className="text-[rgb(var(--text-secondary))]">{d.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Batches */}
              <div className="card p-5">
                <h3 className="mb-3 font-semibold flex items-center justify-between">
                  Batches
                  <span className="text-sm text-[rgb(var(--text-secondary))]">{batches.length}</span>
                </h3>
                <form onSubmit={createBatch} className="mb-4 space-y-2">
                  <input value={newBatch.name} onChange={(e) => setNewBatch({...newBatch, name: e.target.value})} placeholder="Name (e.g., CS-A 2025-2029)" className="input" />
                  <select value={newBatch.departmentId} onChange={(e) => setNewBatch({...newBatch, departmentId: e.target.value})} className="input">
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={newBatch.startYear} onChange={(e) => setNewBatch({...newBatch, startYear: Number(e.target.value)})} placeholder="Start Year" className="input" />
                    <input type="number" value={newBatch.endYear} onChange={(e) => setNewBatch({...newBatch, endYear: Number(e.target.value)})} placeholder="End Year" className="input" />
                  </div>
                  <button type="submit" className="btn-primary w-full">Add</button>
                </form>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {batches.map((b) => (
                    <li key={b.id} className="text-sm p-2 rounded-lg border border-[rgb(var(--border-secondary))]">
                      {b.name} · {b.department?.name} · {b.startYear}-{b.endYear}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subjects */}
              <div className="card p-5">
                <h3 className="mb-3 font-semibold flex items-center justify-between">
                  Subjects
                  <span className="text-sm text-[rgb(var(--text-secondary))]">{subjects.length}</span>
                </h3>
                <form onSubmit={createSubject} className="mb-4 space-y-2">
                  <input value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})} placeholder="Name" className="input" />
                  <input value={newSubject.code} onChange={(e) => setNewSubject({...newSubject, code: e.target.value})} placeholder="Code (e.g., CS401)" className="input" maxLength={10} />
                  <select value={newSubject.departmentId} onChange={(e) => setNewSubject({...newSubject, departmentId: e.target.value})} className="input">
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button type="submit" className="btn-primary w-full">Add</button>
                </form>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {subjects.map((s) => (
                    <li key={s.id} className="text-sm p-2 rounded-lg border border-[rgb(var(--border-secondary))]">
                      {s.name} ({s.code}) · {s.department?.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
