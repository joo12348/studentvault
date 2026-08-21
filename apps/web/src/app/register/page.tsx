"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/lib/auth";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    try {
      await registerUser(data.email, data.password, data.firstName, data.lastName);
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
    "input";

  return (
    <main className="page-container flex min-h-screen items-center justify-center px-4 py-12">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="page-title">Create an account</h1>
          <p className="page-subtitle">Join StudentVault to access academic resources</p>
        </div>

        <div className="card p-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="form-group">
                <label htmlFor="firstName" className="label">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  className={inputClass}
                  placeholder="John"
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="label">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  className={inputClass}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="input"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="input"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full pt-3 pb-3"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
            Already have an account?{" "}
            <Link href="/login" className="text-[rgb(var(--color-primary))] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}