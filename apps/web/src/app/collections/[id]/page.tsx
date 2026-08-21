"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { collectionApi, resourceApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { Toaster, toast } from "react-hot-toast";

interface CollectionItem {
  id: string;
  resource: {
    id: string;
    title: string;
    description?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    subject?: { name: string };
    department?: { name: string };
    viewCount: number;
    downloadCount: number;
    ratingSum: number;
    ratingCount: number;
    createdAt: string;
  };
  note?: string;
  sortOrder: number;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items?: CollectionItem[];
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  subject?: { name: string };
  department?: { name: string };
  viewCount: number;
  downloadCount: number;
  ratingSum: number;
  ratingCount: number;
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

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;
  const { user, isLoading: authLoading, loadUser } = useAuthStore();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await collectionApi.list();
      const found = res.data.find((col: Collection) => col.id === collectionId);
      if (found) {
        setCollection(found);
      } else {
        toast.error("Collection not found");
        router.push("/collections");
      }
    } catch {
      toast.error("Failed to load collection");
      router.push("/collections");
    } finally {
      setLoading(false);
    }
  }, [collectionId, router]);

  const searchResources = useCallback(
    async (page = 1) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await resourceApi.list({
          q: searchQuery,
          page,
          limit: 10,
        });
        const data = res.data as { data: Resource[]; pagination: { totalPages: number } };
        setSearchResults(data.data);
        setSearchTotalPages(data.pagination.totalPages);
        setSearchPage(page);
      } catch {
        toast.error("Failed to search resources");
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    searchResources(1);
  }, [searchQuery]);

  const handleAddResource = async (resourceId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await collectionApi.addItem(collectionId, { resourceId });
      toast.success("Resource added to collection");
      loadCollection();
    } catch {
      toast.error("Failed to add resource");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveResource = async (itemId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await collectionApi.removeItem(collectionId, itemId);
      toast.success("Resource removed from collection");
      loadCollection();
    } catch {
      toast.error("Failed to remove resource");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadCollection();
    }
  }, [user, loadCollection]);

  if (authLoading || !user) {
    return (
      <main className="page-container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[rgb(var(--text-secondary))]">Loading...</p>
        </div>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="page-container flex min-h-screen items-center justify-center">
        <p className="text-[rgb(var(--text-secondary))]">Loading collection...</p>
      </main>
    );
  }

  const alreadyAddedIds = new Set(collection.items?.map((i) => i.resource.id) ?? []);

  return (
    <main className="page-container">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Toaster position="top-center" />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">{collection.name}</h1>
            {collection.description && (
              <p className="page-subtitle">{collection.description}</p>
            )}
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
              {collection.items?.length ?? 0} resource{collection.items?.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Search & Add Section */}
        <section className="mb-10 card p-6">
          <h2 className="text-lg font-semibold mb-4">Add Resources</h2>
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources to add..."
                className="input pl-10 pr-4"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgb(var(--text-tertiary))]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" strokeWidth={1.5} />
                <line x1="21" y1="21" x2="21" y2="21" strokeWidth={1.5} />
              </svg>
            </div>
            <button
              onClick={() => searchResources(1)}
              disabled={searchLoading}
              className="btn-secondary"
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {searchQuery && (
            <div>
              {searchLoading ? (
                <p className="text-[rgb(var(--text-secondary))] py-4">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-[rgb(var(--text-secondary))] py-4">
                  No resources found for "{searchQuery}"
                </p>
              ) : (
                <div className="space-y-3">
{searchResults.map((r) => {
                      const alreadyAdded = alreadyAddedIds.has(r.id);
                      return (
                        <div
                          key={r.id}
                          className="card p-4 flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{r.title}</p>
                            <p className="text-xs text-[rgb(var(--text-secondary))]">
                              {r.subject?.name}{" "}
                              {r.department?.name && `· ${r.department.name}`}
                              {r.fileName && ` · {r.fileName.split(".").pop()}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddResource(r.id)}
                            disabled={alreadyAdded || saving}
                            className="btn-primary"
                          >
                            {alreadyAdded ? "Added" : "Add"}
                          </button>
                        </div>
                      )
                    })}
                  {searchTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => searchResources(searchPage - 1)}
                        disabled={searchPage <= 1}
                        className="btn-secondary"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-[rgb(var(--text-secondary))]">
                        Page {searchPage} of {searchTotalPages}
                      </span>
                      <button
                        onClick={() => searchResources(searchPage + 1)}
                        disabled={searchPage >= searchTotalPages}
                        className="btn-secondary"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Current Items Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">
            Resources in this collection ({collection.items?.length ?? 0})
          </h2>
          {collection.items?.length === 0 ? (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--text-tertiary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium mb-1">No resources in this collection</h3>
              <p className="text-[rgb(var(--text-secondary))] mb-4">Search above to add some</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {collection.items?.map((item) => (
                <article key={item.id} className="card-hover p-5 relative">
                  <button
                    onClick={() => handleRemoveResource(item.id)}
                    disabled={saving}
                    className="absolute top-3 right-3 rounded-full bg-[rgb(var(--color-error))/0.1] p-1.5 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.2] disabled:opacity-50 transition-colors"
                    aria-label="Remove from collection"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="font-semibold mb-1">{item.resource.title}</h3>
                  <p className="text-xs text-[rgb(var(--text-secondary))]">
                    {item.resource.subject?.name}{" "}
                    {item.resource.department?.name && `· ${item.resource.department.name}`}
                  </p>
                  {item.resource.fileSize && (
                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">
                      {(item.resource.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}