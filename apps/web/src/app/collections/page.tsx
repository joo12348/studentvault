"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collectionApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { Toaster, toast } from "react-hot-toast";

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items?: {
    id: string;
    resource: {
      id: string;
      title: string;
      fileName?: string;
    };
    note?: string;
    sortOrder: number;
  }[];
}

export default function CollectionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await collectionApi.list();
      setCollections(res.data);
    } catch {
      toast.error("Failed to load collections.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      fetchCollections();
    }
  }, [user, fetchCollections]);

  const handleCreate = async () => {
    const name = prompt("Collection name?");
    if (!name) return;
    try {
      await collectionApi.create({ name });
      toast.success("Collection created");
      fetchCollections();
    } catch (err: unknown) {
      toast.error("Failed to create collection");
    }
  };

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

  return (
    <main className="page-container">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Toaster position="top-center" />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">My Collections</h1>
            <p className="page-subtitle">
              {collections.length} {collections.length === 1 ? "collection" : "collections"}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Collection
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--text-tertiary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium mb-1">No collections yet</h3>
            <p className="text-[rgb(var(--text-secondary))] mb-6">Create a collection to organize your resources</p>
            <button onClick={handleCreate} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first collection
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="card-hover p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold line-clamp-1">{c.name}</h3>
                  <span className="badge-neutral">{c.isPublic ? "Public" : "Private"}</span>
                </div>
                {c.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">
                    {c.description}
                  </p>
                )}
                <div className="mb-3 flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))]">
                  <span>{c.isPublic ? "Public" : "Private"}</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                {c.items && c.items.length > 0 && (
                  <div className="pt-3 border-t border-[rgb(var(--border-secondary))]">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mb-2">
                      {c.items.length} {c.items.length === 1 ? "resource" : "resources"}
                    </p>
                    <div className="space-y-1">
                      {c.items.slice(0, 3).map((item) => (
                        <p key={item.id} className="text-xs truncate flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{item.resource.title}</span>
                        </p>
                      ))}
                      {c.items.length > 3 && (
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">
                          +{c.items.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}