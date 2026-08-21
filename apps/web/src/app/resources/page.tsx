"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { bookmarkApi, resourceApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { Toaster, toast } from "react-hot-toast";

interface Resource {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  viewCount: number;
  downloadCount: number;
  ratingSum: number;
  ratingCount: number;
  subject?: { name: string } | null;
  department?: { name: string } | null;
  createdAt: string;
}

interface PaginatedResponse {
  data: Resource[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface FileTypeStyle {
  label: string;
  circleClass: string;
  badgeClass: string;
}

const FILE_TYPE_STYLES: Record<string, FileTypeStyle> = {
  pdf: {
    label: "PDF",
    circleClass: "bg-[rgb(var(--color-error))]",
    badgeClass: "bg-[rgb(var(--color-error)/0.12)] text-[rgb(var(--color-error))]",
  },
  doc: {
    label: "DOC",
    circleClass: "bg-[rgb(var(--color-primary))]",
    badgeClass: "bg-[rgb(var(--color-primary)/0.12)] text-[rgb(var(--color-primary))]",
  },
  docx: {
    label: "DOC",
    circleClass: "bg-[rgb(var(--color-primary))]",
    badgeClass: "bg-[rgb(var(--color-primary)/0.12)] text-[rgb(var(--color-primary))]",
  },
  ppt: {
    label: "PPT",
    circleClass: "bg-[rgb(var(--color-warning))]",
    badgeClass: "bg-[rgb(var(--color-warning)/0.12)] text-[rgb(var(--color-warning))]",
  },
  pptx: {
    label: "PPT",
    circleClass: "bg-[rgb(var(--color-warning))]",
    badgeClass: "bg-[rgb(var(--color-warning)/0.12)] text-[rgb(var(--color-warning))]",
  },
  txt: {
    label: "TXT",
    circleClass: "bg-[rgb(var(--color-success))]",
    badgeClass: "bg-[rgb(var(--color-success)/0.12)] text-[rgb(var(--color-success))]",
  },
  xls: {
    label: "XLS",
    circleClass: "bg-[rgb(var(--color-success))]",
    badgeClass: "bg-[rgb(var(--color-success)/0.12)] text-[rgb(var(--color-success))]",
  },
  xlsx: {
    label: "XLS",
    circleClass: "bg-[rgb(var(--color-success))]",
    badgeClass: "bg-[rgb(var(--color-success)/0.12)] text-[rgb(var(--color-success))]",
  },
  csv: {
    label: "CSV",
    circleClass: "bg-[rgb(var(--color-success))]",
    badgeClass: "bg-[rgb(var(--color-success)/0.12)] text-[rgb(var(--color-success))]",
  },
  zip: {
    label: "ZIP",
    circleClass: "bg-[rgb(var(--gray-600))]",
    badgeClass: "bg-[rgb(var(--gray-600)/0.12)] text-[rgb(var(--gray-700))]",
  },
};

function getFileTypeStyle(resource: Pick<Resource, "fileName" | "mimeType">): FileTypeStyle {
  const name = resource.fileName ?? "";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const style = FILE_TYPE_STYLES[ext];
  if (style) return style;
  return {
    label: ext ? ext.slice(0, 4).toUpperCase() : "FILE",
    circleClass: "bg-[rgb(var(--gray-500))]",
    badgeClass: "bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))]",
  };
}

function formatFileSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-12 h-12 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}

function ResourcesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isLoading: authLoading, loadUser } = useAuthStore();

  const [resources, setResources] = useState<Resource[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const query = searchParams?.get("q") ?? "";

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchResources = useCallback(
    async (params: Record<string, unknown>) => {
      setLoading(true);
      try {
        const res = await resourceApi.list(params);
        const data: PaginatedResponse = res.data;
        setResources(data.data);
        setPagination(data.pagination);
      } catch {
        toast.error("Failed to load resources. Please ensure the API is running.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const page = searchParams?.get("page");
    fetchResources({
      q: query || undefined,
      page: page ? Number(page) : undefined,
      limit: 20,
    });
  }, [fetchResources, query, searchParams]);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await bookmarkApi.list();
        const items = res.data?.data ?? res.data ?? [];
        const ids = Array.isArray(items)
          ? items
              .map((b: { resource?: { id?: string }; resourceId?: string; id?: string }) =>
                b.resource?.id ?? b.resourceId ?? b.id
              )
              .filter((x): x is string => typeof x === "string")
          : [];
        setBookmarkedIds(ids);
      } catch {
        setBookmarkedIds([]);
      }
    }
    loadBookmarks();
  }, []);

  const goToPage = (page: number) => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    if (page > 1) {
      sp.set("page", String(page));
    } else {
      sp.delete("page");
    }
    router.push(`${pathname}?${sp.toString()}`);
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) sp.set("q", value);
    else sp.delete("q");
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };

  const clearSearch = () => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    sp.delete("q");
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };

  const handleDownload = async (resourceId: string) => {
    try {
      const res = await resourceApi.download(resourceId);
      window.open(res.data.downloadUrl, "_blank");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleBookmark = async (resourceId: string) => {
    try {
      if (bookmarkedIds.includes(resourceId)) {
        await bookmarkApi.remove(resourceId);
        setBookmarkedIds(bookmarkedIds.filter((id) => id !== resourceId));
        toast.success("Removed from bookmarks");
      } else {
        await bookmarkApi.add(resourceId);
        setBookmarkedIds([...bookmarkedIds, resourceId]);
        toast.success("Bookmarked");
      }
    } catch {
      toast.error("Failed to bookmark");
    }
  };

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const { page, totalPages } = pagination;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (page > 3) pages.push("ellipsis");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="top-center" />

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">
            {query
              ? `${pagination.total} ${pagination.total === 1 ? "result" : "results"} for “${query}”`
              : `Browse ${pagination.total} ${pagination.total === 1 ? "resource" : "resources"}`}
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgb(var(--text-tertiary))]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={onSearchChange}
            placeholder="Search resources..."
            aria-label="Search resources"
            className="input pl-11 pr-10"
          />
          {query && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[rgb(var(--text-tertiary))] transition-colors hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <svg className="mx-auto h-14 w-14" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm4.5 11.625l-2.25 2.25m0 0l-2.25-2.25m2.25 2.25v-6"
              />
            </svg>
          </div>
          <h3 className="empty-state-title">No resources found</h3>
          <p className="empty-state-description">
            {query
              ? `Nothing matches “${query}”. Try a different keyword or clear the search.`
              : "There are no resources yet. Check back later or upload one to get started."}
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const fileType = getFileTypeStyle(r);
              const isBookmarked = bookmarkedIds.includes(r.id);
              const sizeLabel = formatFileSize(r.fileSize);
              const rating =
                r.ratingCount > 0 ? Number(r.ratingSum / r.ratingCount).toFixed(1) : "—";
              return (
                <article key={r.id} className="card-hover flex flex-col p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${fileType.circleClass}`}
                    >
                      <span className="text-[11px] font-bold tracking-wider text-white">
                        {fileType.label}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-semibold leading-snug text-[rgb(var(--text-primary))]">
                        {r.title}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[rgb(var(--text-tertiary))]">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${fileType.badgeClass}`}
                        >
                          {fileType.label}
                        </span>
                        {sizeLabel && <span>{sizeLabel}</span>}
                        {sizeLabel && <span aria-hidden="true">·</span>}
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookmark(r.id)}
                      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                      aria-pressed={isBookmarked}
                      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
                        isBookmarked
                          ? "bg-[rgb(var(--color-warning)/0.15)] text-[rgb(var(--color-warning))]"
                          : "text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-secondary))]"
                      }`}
                    >
                      <StarIcon filled={isBookmarked} />
                    </button>
                  </div>

                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                    {r.description || "No description provided."}
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {r.subject && <span className="badge-primary">{r.subject.name}</span>}
                    {r.department && <span className="badge-neutral">{r.department.name}</span>}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgb(var(--border-secondary))] pt-3">
                    <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))]">
                      <span className="inline-flex items-center gap-1" title={`${r.viewCount} views`}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {r.viewCount}
                      </span>
                      <span className="inline-flex items-center gap-1" title={`${r.downloadCount} downloads`}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {r.downloadCount}
                      </span>
                      <span className="inline-flex items-center gap-1" title={`Rated ${rating}`}>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                        {rating}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownload(r.id)}
                      className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                    >
                      <svg className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Previous
              </button>
              <div className="mx-2 hidden items-center gap-1 sm:flex">
                {getPageNumbers().map((p, idx) =>
                  p === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-sm text-[rgb(var(--text-tertiary))]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      disabled={loading}
                      aria-current={p === pagination.page ? "page" : undefined}
                      aria-label={`Go to page ${p}`}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        p === pagination.page
                          ? "bg-[rgb(var(--color-primary))] text-white shadow-sm"
                          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <span className="mx-2 text-sm text-[rgb(var(--text-secondary))] sm:hidden">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
