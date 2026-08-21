"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore, isStudent, isFaculty, isAdmin } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];

interface UserWithProfiles {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfile?: { firstName: string; lastName: string } | null;
  facultyProfile?: { firstName: string; lastName: string } | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const DashboardIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const ResourceIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const FolderIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const UploadIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const AdminIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function getNavItems(user: UserWithProfiles | null): NavItem[] {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
    { label: "Resources", href: "/resources", icon: ResourceIcon },
  ];
  if (isStudent(user)) items.push({ label: "Collections", href: "/collections", icon: FolderIcon });
  if (isFaculty(user)) items.push({ label: "My Resources", href: "/faculty", icon: UploadIcon });
  if (isAdmin(user)) items.push({ label: "Admin", href: "/admin", icon: AdminIcon });
  return items;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, loadUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadUser(); }, [loadUser]);

  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/shared");

  if (!isPublic && (isLoading || !user)) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[rgb(var(--text-secondary))]">Loading StudentVault...</p>
        </div>
      </div>
    );
  }

  if (isPublic || !user) return <>{children}</>;

  const u = user as UserWithProfiles;
  const navItems = getNavItems(u);
  const fn = u.studentProfile?.firstName || u.facultyProfile?.firstName || "";
  const ln = u.studentProfile?.lastName || u.facultyProfile?.lastName || "";
  const initials = ((fn[0] || "") + (ln[0] || "")).toUpperCase() || "??";
  const displayName = fn || user.email;
  const roleLabel = user.role === "STUDENT" ? "Student" : user.role === "FACULTY" ? "Instructor" : "Admin";

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-secondary))] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[rgb(var(--bg-primary))] border-r border-[rgb(var(--border-secondary))] flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[rgb(var(--border-secondary))] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--color-primary))] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.797 0 3.418.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.798 0-3.418.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-[rgb(var(--text-primary))]">StudentVault</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? "bg-[rgb(var(--color-primary))/0.08] text-[rgb(var(--color-primary))]" : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]"}`}>
                <span className={isActive ? "text-[rgb(var(--color-primary))]" : "text-[rgb(var(--text-tertiary))]"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[rgb(var(--border-secondary))] shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">{displayName}</p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">{roleLabel}</p>
            </div>
          </div>
          <button onClick={async () => { await useAuthStore.getState().logout(); router.push("/login"); setSidebarOpen(false); }}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--color-error))/0.08] hover:text-[rgb(var(--color-error))] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-[rgb(var(--bg-primary))] border-b border-[rgb(var(--border-secondary))] flex items-center px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-secondary))]" aria-label="Open menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))]">
            <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-success))]"></div>
            Connected
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
