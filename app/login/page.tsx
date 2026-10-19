"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  Users,
  Home,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/use-auth";
import { Role } from "@/types";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { loginSchema, LoginFormValues, zodResolver } from "@/lib/validations";

const CORE_TEST_ROLES: {
  role: Role;
  name: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgLight: string;
}[] = [
  {
    role: "community_admin",
    name: "Marcus Vance",
    email: "marcus.v@heritagehills.org",
    icon: ShieldCheck,
    accentColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20",
    bgLight: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  },
  {
    role: "event_organizer",
    name: "Sophia Chen",
    email: "sophia.chen@eventspark.com",
    icon: CalendarDays,
    accentColor: "text-amber-600 dark:text-amber-400",
    borderColor: "hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20",
    bgLight: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  {
    role: "family_head",
    name: "David K. Thornton",
    email: "david.thornton@gmail.com",
    icon: Home,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20",
    bgLight: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  {
    role: "member",
    name: "Amara Patel",
    email: "amara.patel@gmail.com",
    icon: Users,
    accentColor: "text-blue-600 dark:text-blue-400",
    borderColor: "hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20",
    bgLight: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { login, mockLoginAsRole } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTestRole, setActiveTestRole] = useState<Role | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const res = await login(values.email, values.password);
      if (res.success) {
        router.push(redirectPath);
      } else {
        setFormError(res.error || "Authentication failed. Please verify credentials.");
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    }
  };

  const handleQuickRoleSelect = (role: Role, email: string) => {
    setActiveTestRole(role);
    setValue("email", email);
    setValue("password", "password123");
    mockLoginAsRole(role);
    setTimeout(() => {
      router.push(redirectPath);
    }, 350);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-radial from-indigo-50/70 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      {/* Background visual accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/30 mb-3 animate-in zoom-in-90 duration-300">
            <Layers className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to Invita
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Community Celebrations, Family Registries & Digital Invitations
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-zinc-950/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95">
          {/* Form Error Alert */}
          {formError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Authentication Error</span>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@community.org"
                  className={`pl-9 ${errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  onClick={() =>
                    alert("Demo tip: For test accounts, use password 'password123' or the 1-click role buttons below!")
                  }
                >
                  Need credentials?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`pl-9 pr-10 ${errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !!activeTestRole}
              className="w-full h-10 mt-2 font-semibold shadow-md shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Invita"
              )}
            </Button>
          </form>

          {/* Quick Mock Role Login Section */}
          <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Instant Role Testing (4 Roles)
              </span>
              <span className="text-[11px] text-zinc-400">1-click test login</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CORE_TEST_ROLES.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTestRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickRoleSelect(item.role, item.email)}
                    className={`flex items-start gap-3 p-3 text-left rounded-xl border border-zinc-200/80 dark:border-zinc-800 transition-all ${item.borderColor} ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40" : "bg-zinc-50/50 dark:bg-zinc-900/40"}`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${item.bgLight}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {ROLE_LABELS[item.role]}
                        </span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                      </div>
                      <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                        {item.name}
                      </span>
                      <span className="block text-[10px] text-zinc-400 truncate mt-0.5">
                        {ROLE_DESCRIPTIONS[item.role]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Invita Identity Framework · Role-based permissions matrix enabled
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs text-zinc-500">Loading Invita Identity...</span>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
