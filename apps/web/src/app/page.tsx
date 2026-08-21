"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { useAuthStore, isStudent, isFaculty, isAdmin } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, loadUser, register } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin(user)) router.push("/admin");
      else if (isFaculty(user)) router.push("/faculty");
      else router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  const passwordScore = Math.min(100, Math.max(0, password.length * 10));
  const passwordLooksGood = password.length >= 8;
  const passwordWeak = password.length > 0 && password.length < 6;
  const passwordMedium = password.length >= 6 && password.length < 8;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!passwordLooksGood) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || ".";
      const registerRole = role === "instructor" ? "FACULTY" : "STUDENT";
      await register(email, password, firstName, lastName, registerRole);
      toast.success("Registration successful! Please verify your email.");
      router.push("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(
        Array.isArray(message) ? message[0] : message || "Registration failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[rgb(var(--border-secondary))] bg-[rgb(var(--bg-primary))/0.8] px-4 py-3 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all duration-200 backdrop-blur-sm";
  const btnClass =
    "relative w-full rounded-lg py-3 text-sm font-medium text-white transition-all duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed";

  if (isLoading) {
    return (
      <main className="page-container flex min-h-screen items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="text-center z-10">
          <div className="w-12 h-12 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[rgb(var(--text-secondary))]">Loading StudentVault...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
      <AnimatedBackground />
      <FloatingShapes count={8} />
      <Toaster position="top-center" />
      <div className="w-full max-w-md z-10 relative">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] mb-4 animate-pulse-slow shadow-[0_0_30px_rgb(var(--color-primary)/0.4)]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.797 0 3.418.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.798 0-3.418.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="page-title animate-gradient-text">StudentVault</h1>
          <p className="page-subtitle mt-2 animate-fade-in-up delay-200">Your academic universe, unlocked.</p>
        </div>

        <div className="card bg-[rgb(var(--bg-primary))/0.9] backdrop-blur-xl border-[rgb(var(--border-secondary))/0.5] p-8 animate-slide-up delay-300 shadow-[0_25px_50px_rgba(0,0,0,0.15)]">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="form-group">
              <label htmlFor="fullName" className="label">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--bg-secondary))]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordLooksGood
                          ? "bg-[rgb(var(--color-success))]"
                          : passwordMedium
                          ? "bg-[rgb(var(--color-warning))]"
                          : passwordWeak
                          ? "bg-[rgb(var(--color-danger))]"
                          : "bg-[rgb(var(--color-primary))]"
                      }`}
                      style={{ width: `${passwordScore}%` }}
                    ></div>
                  </div>
                  {passwordLooksGood && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[rgb(var(--color-success))]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Password looks good
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    role === "student"
                      ? "border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] shadow-[0_0_20px_rgb(var(--color-primary)/0.2)] scale-[1.02]"
                      : "border-[rgb(var(--border-secondary))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--color-primary))/0.4] hover:bg-[rgb(var(--color-primary))/0.05]"
                  }`}
                >
                  <span className="text-xl animate-bounce-subtle">🎓</span>
                  Student
                  {role === "student" && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[rgb(var(--color-primary))] animate-pulse"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("instructor")}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    role === "instructor"
                      ? "border-[rgb(var(--color-warning))] bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] shadow-[0_0_20px_rgb(var(--color-warning)/0.2)] scale-[1.02]"
                      : "border-[rgb(var(--border-secondary))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--color-warning))/0.4] hover:bg-[rgb(var(--color-warning))/0.05]"
                  }`}
                >
                  <span className="text-xl animate-bounce-subtle delay-100">👩‍🏫</span>
                  Instructor
                  {role === "instructor" && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[rgb(var(--color-warning))] animate-pulse"></span>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
                {role === "student"
                  ? "Use academic resources, manage academic info, track performance, achievements, deadlines, and library status, and contribute resources."
                  : "Upload and manage official resources, share with batches, and view engagement and authorized student/batch insights."}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`${btnClass} bg-gradient-to-r from-[rgb(var(--color-primary))] via-[rgb(var(--color-primary-light))] to-[rgb(var(--color-primary))] bg-[length:200%_100%] animate-gradient-shift hover:from-[rgb(var(--color-primary-hover))] hover:via-[rgb(var(--color-primary))] hover:to-[rgb(var(--color-primary-hover))] active:scale-[0.98] shadow-[0_10px_30px_rgb(var(--color-primary)/0.4)]`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
            Already have an account?{" "}
            <Link href="/login" className="text-[rgb(var(--color-primary))] font-medium hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center animate-fade-in-up delay-500">
          <p className="text-xs text-[rgb(var(--text-tertiary))/0.7">
            Demo: student@example.com / SecurePass123!
          </p>
        </div>
      </div>
    </main>
  );
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--color-primary))/0.15] via-transparent to-[rgb(var(--color-warning))/0.15] animate-gradient-shift-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgb(var(--color-primary))/0.08] via-transparent to-transparent animate-pulse-slower" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_var(--tw-gradient-stops))] from-[rgb(var(--color-success))/0.06] via-transparent to-transparent animate-pulse-slowest" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-[rgb(var(--color-warning))/0.06] via-transparent to-transparent animate-pulse-slowest delay-1000" />
    </div>
  );
}

function FloatingShapes({ count = 8 }: { count: number }) {
  const shapes = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 40 + Math.random() * 80,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 15 + Math.random() * 15,
    color: [`rgb(var(--color-primary))`, `rgb(var(--color-warning))`, `rgb(var(--color-success))`, `rgb(var(--color-error))`][Math.floor(Math.random() * 4)],
    blur: 40 + Math.random() * 60,
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute rounded-full opacity-20 animate-float"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            backgroundColor: shape.color,
            filter: `blur(${shape.blur}px)`,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
          }}
        />
      ))}
    </div>
  );
}