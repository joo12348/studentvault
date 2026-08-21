"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore, isStudent, isFaculty, isAdmin } from "@/lib/auth";
import { resourceApi, bookmarkApi } from "@/lib/api";

interface QuickAction {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}

const ResourcesIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const BookmarkIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c.499 0 .905.406.905.905v15.193a.45.45 0 01-.703.374l-5.325-3.55a.45.45 0 00-.498 0l-5.327 3.55a.45.45 0 01-.702-.373V4.227c0-.499.406-.905.905-.905h10.745z" />
  </svg>
);

const ShieldIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const UserIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const FolderIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const UploadIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const AdminPanelIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.52 6.52 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getRoleLabel(role: string): string {
  if (role === "STUDENT") return "Student";
  if (role === "FACULTY") return "Faculty";
  if (role === "ADMIN") return "Admin";
  return role;
}

function getStatusDotClass(status: string): string {
  if (status === "ACTIVE") return "bg-[rgb(var(--color-success))]";
  if (status === "SUSPENDED") return "bg-[rgb(var(--color-error))]";
  return "bg-[rgb(var(--color-warning))]";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalResources, setTotalResources] = useState<number | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setStatsLoading(true);
      try {
        const [resourcesRes, bookmarksRes] = await Promise.all([
          resourceApi.list({ limit: 1 }),
          bookmarkApi.list(),
        ]);
        if (cancelled) return;

        const pagination = resourcesRes.data?.pagination;
        const resourceList = resourcesRes.data?.data;
        const resourcesTotal =
          typeof pagination?.total === "number"
            ? pagination.total
            : Array.isArray(resourceList)
              ? resourceList.length
              : 0;

        const bookmarkData = bookmarksRes.data?.data ?? bookmarksRes.data;
        const bookmarksTotal =
          typeof bookmarksRes.data?.pagination?.total === "number"
            ? bookmarksRes.data.pagination.total
            : Array.isArray(bookmarkData)
              ? bookmarkData.length
              : 0;

        setTotalResources(resourcesTotal);
        setBookmarkCount(bookmarksTotal);
      } catch {
        if (!cancelled) {
          setTotalResources(null);
          setBookmarkCount(null);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const profileUser = user as typeof user & {
    studentProfile?: { firstName?: string };
    facultyProfile?: { firstName?: string };
  };

  const firstName =
    profileUser.studentProfile?.firstName ||
    profileUser.facultyProfile?.firstName ||
    user.email.split("@")[0];

  const quickActions: QuickAction[] = [
    {
      href: "/resources",
      icon: ResourcesIcon,
      iconClass: "bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))]",
      title: "Browse Resources",
      description: "Explore and search academic materials across departments",
    },
    ...(isStudent(user)
      ? [
          {
            href: "/collections",
            icon: FolderIcon,
            iconClass: "bg-[rgb(var(--color-success)/0.1)] text-[rgb(var(--color-success))]",
            title: "My Collections",
            description: "Organize resources into personal collections",
          },
        ]
      : []),
    ...(isFaculty(user)
      ? [
          {
            href: "/faculty",
            icon: UploadIcon,
            iconClass: "bg-[rgb(var(--color-warning)/0.1)] text-[rgb(var(--color-warning))]",
            title: "Faculty Tools",
            description: "Upload resources and track student engagement",
          },
        ]
      : []),
    ...(isAdmin(user)
      ? [
          {
            href: "/admin",
            icon: AdminPanelIcon,
            iconClass: "bg-[rgb(var(--color-error)/0.1)] text-[rgb(var(--color-error))]",
            title: "Admin Panel",
            description: "Manage users, moderation queues, and analytics",
          },
        ]
      : []),
  ];

  const statCards = [
    {
      key: "resources",
      href: "/resources",
      icon: ResourcesIcon,
      iconClass: "text-[rgb(var(--color-primary))]",
      label: "Total Resources",
      value: statsLoading ? null : totalResources,
    },
    {
      key: "bookmarks",
      href: "/resources",
      icon: BookmarkIcon,
      iconClass: "text-[rgb(var(--color-warning))]",
      label: "My Bookmarks",
      value: statsLoading ? null : bookmarkCount,
    },
    {
      key: "status",
      href: null,
      icon: ShieldIcon,
      iconClass: "text-[rgb(var(--color-success))]",
      label: "Account Status",
      value: user.status,
    },
    {
      key: "role",
      href: null,
      icon: UserIcon,
      iconClass: "text-[rgb(var(--text-secondary))]",
      label: "Role",
      value: getRoleLabel(user.role),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          Here&apos;s what&apos;s happening with your study materials today.
        </p>
      </header>

      <section aria-label="Stats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const inner = (
            <div className="stat-card h-full">
              <div className="flex items-center justify-between gap-2">
                <span className="stat-card-label">{stat.label}</span>
                <span className={stat.iconClass}>{stat.icon}</span>
              </div>
              {stat.value === null ? (
                <div className="h-7 w-14 rounded bg-[rgb(var(--bg-hover))] animate-pulse mt-1" />
              ) : stat.key === "status" && typeof stat.value === "string" ? (
                <span className="stat-card-value flex items-center gap-2 text-xl">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDotClass(stat.value)}`}
                  />
                  {getRoleLabel(stat.value)}
                </span>
              ) : (
                <span className="stat-card-value">{stat.value}</span>
              )}
            </div>
          );
          return stat.href ? (
            <Link key={stat.key} href={stat.href} className="card-hover block rounded-xl">
              {inner}
            </Link>
          ) : (
            <div key={stat.key} className="card rounded-xl">
              {inner}
            </div>
          );
        })}
      </section>

      <section aria-label="Quick actions">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))] mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="card-hover p-6 flex flex-col">
              <div
                className={`w-12 h-12 rounded-xl ${action.iconClass} flex items-center justify-center mb-4`}
              >
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold mb-1 text-[rgb(var(--text-primary))]">
                {action.title}
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))]">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
