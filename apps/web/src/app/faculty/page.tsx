"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { resourceApi, facultyApi, uploadApi } from "@/lib/api";
import { useAuthStore, isFaculty } from "@/lib/auth";
import { Toaster, toast } from "react-hot-toast";

interface Resource {
  id: string;
  title: string;
  description?: string;
  resourceType: string;
  status: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  subject?: { name: string };
  department?: { name: string };
  semester?: { number: number };
  batch?: { name: string };
  viewCount: number;
  downloadCount: number;
  ratingSum: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: string;
  email: string;
  studentProfile?: {
    firstName: string;
    lastName: string;
    enrollmentNumber?: string;
    batch?: { name: string };
    department?: { name: string };
  };
}

type Tab = "upload" | "my-resources" | "engagement" | "students";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    PENDING_REVIEW: {
      label: "Pending Review",
      classes: "badge-warning",
    },
    APPROVED: { label: "Approved", classes: "badge-success" },
    REJECTED: { label: "Rejected", classes: "badge-error" },
    ARCHIVED: { label: "Archived", classes: "badge-neutral" },
    DRAFT: { label: "Draft", classes: "badge-neutral" },
  };
  const c = config[status] ?? {
    label: status,
    classes: "badge-neutral",
  };
  return <span className={c.classes}>{c.label}</span>;
}

export default function FacultyDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [loading, setLoading] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    resourceType: "NOTES",
    departmentId: "",
    batchId: "",
    semesterId: "",
    subjectId: "",
    topic: "",
    year: "",
    unit: "",
    fileName: "",
    fileSize: 0,
    mimeType: "",
    visibility: "batch",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My Resources state
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [resourcesTotalPages, setResourcesTotalPages] = useState(0);

  // Engagement state
  const [engagement, setEngagement] = useState<Record<string, unknown> | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotalPages, setStudentsTotalPages] = useState(0);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user && !isFaculty(user)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && isFaculty(user)) {
      if (activeTab === "my-resources") loadMyResources();
      else if (activeTab === "engagement") loadEngagement();
      else if (activeTab === "students") loadStudents();
    }
  }, [activeTab, user]);

  const loadMyResources = async () => {
    setResourcesLoading(true);
    try {
      const res = await facultyApi.getMyResources({ page: resourcesPage, limit: 10 });
      setMyResources(res.data.data);
      setResourcesTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error("Failed to load resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadEngagement = async () => {
    setEngagementLoading(true);
    try {
      if (selectedBatchId) {
        const res = await facultyApi.getBatchEngagement(selectedBatchId);
        setEngagement(res.data);
      }
    } catch {
      toast.error("Failed to load engagement");
    } finally {
      setEngagementLoading(false);
    }
  };

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await facultyApi.getStudents({ page: studentsPage, limit: 20 });
      setStudents(res.data.data);
      setStudentsTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleUploadChange = (field: string, value: unknown) => {
    setUploadForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }));
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.resourceType) {
      toast.error("Title and resource type are required");
      return;
    }
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    setUploading(true);
    try {
      // Step 1: Initiate upload
      const initiateRes = await uploadApi.initiate({
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        mimeType: uploadFile.type,
      });
      const { uploadId, uploadUrl } = initiateRes.data;

      // Step 2: Upload file to storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadFile,
        headers: {
          "Content-Type": uploadFile.type,
        },
      });
      if (!uploadRes.ok) {
        throw new Error("File upload failed");
      }

      // Step 3: Complete upload
      const checksum = ""; // In real app, compute SHA-256
      await uploadApi.complete({ uploadId, checksum });

      // Step 4: Create resource with file info
      await resourceApi.create({
        title: uploadForm.title,
        description: uploadForm.description,
        resourceType: uploadForm.resourceType,
        departmentId: uploadForm.departmentId || undefined,
        batchId: uploadForm.batchId || undefined,
        semesterId: uploadForm.semesterId || undefined,
        subjectId: uploadForm.subjectId || undefined,
        topic: uploadForm.topic || undefined,
        year: uploadForm.year ? Number(uploadForm.year) : undefined,
        unit: uploadForm.unit ? Number(uploadForm.unit) : undefined,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        mimeType: uploadFile.type,
        visibility: uploadForm.visibility,
        storageKey: initiateRes.data.objectKey,
      });

      toast.success("Resource uploaded successfully!");
      setUploadForm({
        title: "",
        description: "",
        resourceType: "NOTES",
        departmentId: "",
        batchId: "",
        semesterId: "",
        subjectId: "",
        topic: "",
        year: "",
        unit: "",
        fileName: "",
        fileSize: 0,
        mimeType: "",
        visibility: "batch",
      });
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (activeTab === "my-resources") loadMyResources();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to upload resource");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await resourceApi.delete(id);
      toast.success("Resource deleted");
      loadMyResources();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (authLoading || !user) {
    return (
      <main className="flex items-center justify-center py-24">
        <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
      </main>
    );
  }

  if (!isFaculty(user)) {
    return (
      <main className="flex items-center justify-center py-24">
        <p className="text-[rgb(var(--text-secondary))]">Access denied. Faculty only.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <Toaster position="top-center" />
      <header className="mb-8">
        <h1 className="page-title">Faculty Dashboard</h1>
        <p className="page-subtitle">Welcome, {user.email}</p>
      </header>

      {/* Tabs */}
      <nav className="tab-bar" role="tablist">
        {(
          [
            { id: "upload", label: "Upload Resource" },
            { id: "my-resources", label: "My Resources" },
            { id: "engagement", label: "Engagement" },
            { id: "students", label: "Students" },
          ] as const).map((tab) => (
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

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <form onSubmit={handleUploadSubmit} className="max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold">Upload New Resource</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="upload-title" className="label">Title *</label>
              <input
                id="upload-title"
                type="text"
                value={uploadForm.title}
                onChange={(e) => handleUploadChange("title", e.target.value)}
                className="input"
                placeholder="Resource title"
              />
            </div>
            <div>
              <label htmlFor="upload-type" className="label">Resource Type *</label>
              <select
                id="upload-type"
                value={uploadForm.resourceType}
                onChange={(e) => handleUploadChange("resourceType", e.target.value)}
                className="input"
              >
                <option value="NOTES">Notes</option>
                <option value="PPT">Presentation</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="EXAM_PAPER">Exam Paper</option>
                <option value="SYLLABUS">Syllabus</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="upload-description" className="label">Description</label>
            <textarea
              id="upload-description"
              value={uploadForm.description}
              onChange={(e) => handleUploadChange("description", e.target.value)}
              rows={3}
              className="input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="upload-department" className="label">Department</label>
              <select
                id="upload-department"
                value={uploadForm.departmentId}
                onChange={(e) => handleUploadChange("departmentId", e.target.value)}
                className="input"
              >
                <option value="">Select department</option>
              </select>
            </div>
            <div>
              <label htmlFor="upload-batch" className="label">Batch</label>
              <select
                id="upload-batch"
                value={uploadForm.batchId}
                onChange={(e) => handleUploadChange("batchId", e.target.value)}
                className="input"
              >
                <option value="">Select batch</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="upload-semester" className="label">Semester</label>
              <select
                id="upload-semester"
                value={uploadForm.semesterId}
                onChange={(e) => handleUploadChange("semesterId", e.target.value)}
                className="input"
              >
                <option value="">Select semester</option>
              </select>
            </div>
            <div>
              <label htmlFor="upload-subject" className="label">Subject</label>
              <select
                id="upload-subject"
                value={uploadForm.subjectId}
                onChange={(e) => handleUploadChange("subjectId", e.target.value)}
                className="input"
              >
                <option value="">Select subject</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="upload-topic" className="label">Topic</label>
              <input
                id="upload-topic"
                type="text"
                value={uploadForm.topic}
                onChange={(e) => handleUploadChange("topic", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="upload-year" className="label">Year</label>
              <input
                id="upload-year"
                type="number"
                value={uploadForm.year}
                onChange={(e) => handleUploadChange("year", e.target.value)}
                min={1}
                max={4}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="upload-unit" className="label">Unit</label>
              <input
                id="upload-unit"
                type="number"
                value={uploadForm.unit}
                onChange={(e) => handleUploadChange("unit", e.target.value)}
                min={1}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="upload-visibility" className="label">Visibility</label>
              <select
                id="upload-visibility"
                value={uploadForm.visibility}
                onChange={(e) => handleUploadChange("visibility", e.target.value)}
                className="input"
              >
                <option value="batch">Batch only</option>
                <option value="selected_batches">Selected batches</option>
                <option value="all">All students</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="form-group">
            <span className="label">File *</span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`drop-zone ${isDragging ? "drop-zone-active" : ""}`}
            >
              <svg
                className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {uploadFile ? (
                <>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{uploadFile.name}</p>
                  <p className="form-hint mt-1">
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB · Click or drop to replace
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Drag &amp; drop your file here
                  </p>
                  <p className="form-hint mt-1">or click to browse · PDF, DOC, PPT, TXT, ZIP</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
              className="hidden"
              required
            />
          </div>

          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <button type="submit" disabled={uploading} className="btn-primary w-full">
              {uploading ? "Uploading..." : "Upload Resource"}
            </button>
          </div>
        </form>
      )}

      {/* My Resources Tab */}
      {activeTab === "my-resources" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Resources</h2>
            <button onClick={() => { setActiveTab("upload"); }} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resource
            </button>
          </div>

          {resourcesLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : myResources.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-[rgb(var(--text-secondary))]">
                No resources yet. Create your first resource.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {myResources.map((r) => (
                  <div key={r.id} className="card p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate text-[rgb(var(--text-primary))]">{r.title}</p>
                        <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                          {r.resourceType} · {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border-secondary))]">
                      <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-secondary))]">
                        <span>{r.viewCount} views</span>
                        <span>{r.downloadCount} downloads</span>
                      </div>
                      <button onClick={() => handleDelete(r.id)} className="btn-danger px-3 py-1.5 text-xs">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {resourcesTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setResourcesPage((p) => Math.max(1, p - 1)); loadMyResources(); }}
                    disabled={resourcesPage <= 1 || resourcesLoading}
                    className="btn-secondary"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">
                    Page {resourcesPage} of {resourcesTotalPages}
                  </span>
                  <button
                    onClick={() => { setResourcesPage((p) => p + 1); loadMyResources(); }}
                    disabled={resourcesPage >= resourcesTotalPages || resourcesLoading}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === "engagement" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Engagement Analytics</h2>
          <div className="mb-6">
            <label htmlFor="engagement-batch" className="label">Select Batch</label>
            <select
              id="engagement-batch"
              value={selectedBatchId}
              onChange={(e) => { setSelectedBatchId(e.target.value); loadEngagement(); }}
              className="input max-w-sm"
            >
              <option value="">Select a batch</option>
            </select>
          </div>

          {engagementLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : selectedBatchId ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="stat-card">
                <p className="stat-card-label">Total Views</p>
                <p className="stat-card-value">—</p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">Total Downloads</p>
                <p className="stat-card-value">—</p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">Avg Rating</p>
                <p className="stat-card-value">—</p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">Active Students</p>
                <p className="stat-card-value">—</p>
              </div>
            </div>
          ) : (
            <p className="text-[rgb(var(--text-secondary))]">Select a batch to view engagement</p>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Students</h2>

          {studentsLoading ? (
            <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
          ) : students.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-[rgb(var(--text-secondary))]">No students found.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Batch</th>
                      <th>Department</th>
                      <th>Enrollment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td>
                          {s.studentProfile?.firstName} {s.studentProfile?.lastName}
                        </td>
                        <td>{s.email}</td>
                        <td>{s.studentProfile?.batch?.name ?? "—"}</td>
                        <td>{s.studentProfile?.department?.name ?? "—"}</td>
                        <td>{s.studentProfile?.enrollmentNumber ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {studentsTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setStudentsPage((p) => Math.max(1, p - 1)); loadStudents(); }}
                    disabled={studentsPage <= 1 || studentsLoading}
                    className="btn-secondary"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">
                    Page {studentsPage} of {studentsTotalPages}
                  </span>
                  <button
                    onClick={() => { setStudentsPage((p) => p + 1); loadStudents(); }}
                    disabled={studentsPage >= studentsTotalPages || studentsLoading}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
