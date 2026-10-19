"use client";

import React, { useState, useEffect, use, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/hooks/use-auth";
import { can } from "@/lib/permissions";
import { PageHeader, EmptyState, StatusBadge, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  exportAttendeesToExcel,
  exportAttendeesToPdf,
  AttendeeExportItem,
  EventExportSummary,
} from "@/lib/export";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Send,
  ExternalLink,
  Utensils,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Home,
  Layers,
  User,
  ShieldAlert,
  Loader2,
  Calendar,
  Check,
  ChevronDown,
} from "lucide-react";

interface AttendeesPageProps {
  params: Promise<{ id: string }>;
}

function AttendeeReportContent({ eventId }: { eventId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentRole } = useAuthStore();

  // Permission Verification
  const hasAccess = can(currentRole || "guest", "rsvp:view_all");

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<"all" | "attending" | "pending" | "declined">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("all");
  const [selectedSubCommunityId, setSelectedSubCommunityId] = useState<string>("all");
  const [selectedCohortType, setSelectedCohortType] = useState<string>("all");

  // Live polling state & tab visibility tracking
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [manualRefreshedAt, setManualRefreshedAt] = useState<Date>(() => new Date());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Export Modal State
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel");
  const [exportScope, setExportScope] = useState<"filtered" | "all">("filtered");
  const [isExporting, setIsExporting] = useState(false);

  // Reminders to Pending Modal State
  const [isReminderConfirmOpen, setIsReminderConfirmOpen] = useState(false);
  const [resentInviteId, setResentInviteId] = useState<string | null>(null);

  // Monitor visibility state to pause live polling when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Fetch Event Details
  const {
    data: event,
    isLoading: isEventLoading,
    isError: isEventError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.events.getById(eventId),
    enabled: hasAccess,
  });

  // Fetch Invitations with live polling (15s refetch interval when tab visible)
  const {
    data: invitations = [],
    isLoading: isInvsLoading,
    refetch: refetchInvitations,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["invitations", eventId],
    queryFn: () => api.invitations.list(eventId),
    enabled: hasAccess,
    refetchInterval: isTabVisible ? 15000 : false,
    refetchIntervalInBackground: false,
  });

  // Fetch RSVP detailed responses with live polling
  const {
    data: rsvpResponses = [],
    isLoading: isRsvpsLoading,
    refetch: refetchRsvps,
  } = useQuery({
    queryKey: ["rsvp-responses", eventId],
    queryFn: () => api.rsvps.listResponses(eventId),
    enabled: hasAccess,
    refetchInterval: isTabVisible ? 15000 : false,
    refetchIntervalInBackground: false,
  });

  // Fetch Families for filter dropdown
  const { data: families = [] } = useQuery({
    queryKey: ["families", event?.communityId],
    queryFn: () => api.families.list(event?.communityId),
    enabled: !!event?.communityId && hasAccess,
  });

  // Fetch SubCommunities for filter dropdown
  const { data: subCommunities = [] } = useQuery({
    queryKey: ["sub-communities", event?.communityId],
    queryFn: () => api.subCommunities.list(event?.communityId),
    enabled: !!event?.communityId && hasAccess,
  });

  // Derived timestamp of last data arrival
  const lastRefreshedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : manualRefreshedAt;

  // Mutation: Send reminders to all pending invitees
  const sendRemindersMutation = useMutation({
    mutationFn: () => api.invitations.sendRemindersToPending(eventId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setIsReminderConfirmOpen(false);
      toast.success(
        "Reminders Dispatched",
        `Notification alerts have been delivered to ${res?.count ?? "all"} pending guest(s).`
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Send Reminders", msg);
    },
  });

  // Mutation: Resend single invitation
  const resendSingleMutation = useMutation({
    mutationFn: (invId: string) => api.invitations.resendInvitation(invId),
    onSuccess: (updatedInv) => {
      setResentInviteId(updatedInv.id);
      setTimeout(() => setResentInviteId(null), 2500);
      queryClient.invalidateQueries({ queryKey: ["invitations", eventId] });
      toast.success(
        "Invitation Resent",
        `Dispatched a refreshed invitation link to ${updatedInv.recipientName}.`
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Resend Invitation", msg);
    },
  });

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await Promise.all([refetchInvitations(), refetchRsvps()]);
    setManualRefreshedAt(new Date());
    setTimeout(() => setIsManualRefreshing(false), 500);
  };

  // Combine Invitations and RSVP details into a unified attendee record list
  const attendeeItems: AttendeeExportItem[] = useMemo(() => {
    return invitations.map((inv) => {
      const response = rsvpResponses.find(
        (r) => r.invitationId === inv.id || (inv.token && r.token === inv.token)
      );

      let affiliation = "Individual Guest";
      if (inv.recipientType === "family") {
        const fam = families.find((f) => f.id === inv.recipientId);
        affiliation = fam ? `${fam.familyName} Household` : "Family Household";
      } else if (inv.recipientType === "sub_community") {
        const sub = subCommunities.find((s) => s.id === inv.recipientId);
        affiliation = sub ? `${sub.name} (Group)` : "Sub-Community Group";
      } else if (inv.recipientType === "outside_guest") {
        affiliation = "Outside VIP Guest";
      }

      const status =
        response?.status === "attending"
          ? "attending"
          : response?.status === "declined"
          ? "declined"
          : inv.status === "responded"
          ? "attending"
          : "pending";

      const attendingCount =
        status === "attending"
          ? response?.guestCount || inv.allowedGuestsCount || 1
          : 0;

      return {
        name: inv.recipientName,
        affiliation,
        type: inv.recipientType,
        status,
        attendingCount,
        allowedGuests: inv.allowedGuestsCount || 1,
        mealPreference: response?.mealPreference || "",
        dietaryNotes: response?.dietaryRequirements || "",
        personalNote: response?.notes || inv.customMessage || "",
        responseDate: response?.respondedAt
          ? new Date(response.respondedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        email: inv.recipientEmail || "",
        phone: inv.recipientPhone || "",
        inviteCode: inv.inviteCode,
      };
    });
  }, [invitations, rsvpResponses, families, subCommunities]);

  // Aggregate Metrics
  const totalInvitedCount = invitations.length;
  const acceptedInvites = attendeeItems.filter((i) => i.status === "attending");
  const acceptedCount = acceptedInvites.length;
  const declinedInvites = attendeeItems.filter((i) => i.status === "declined");
  const declinedCount = declinedInvites.length;
  const pendingInvites = attendeeItems.filter((i) => i.status === "pending");
  const pendingCount = pendingInvites.length;

  // Sum of total headcount of accepted attendees
  const totalHeadcount = acceptedInvites.reduce(
    (sum, item) => sum + (item.attendingCount || 1),
    0
  );

  // Meal Preference Breakdown
  const mealBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    acceptedInvites.forEach((item) => {
      const meal = item.mealPreference || "Chef's Artisanal Tasting";
      counts[meal] = (counts[meal] || 0) + (item.attendingCount || 1);
    });
    return counts;
  }, [acceptedInvites]);

  // Dietary Notes List
  const dietaryAlerts = useMemo(() => {
    return acceptedInvites
      .filter((i) => i.dietaryNotes && i.dietaryNotes.trim().length > 0)
      .map((i) => ({
        name: i.name,
        notes: i.dietaryNotes,
      }));
  }, [acceptedInvites]);

  // Filtered Attendees for Display
  const filteredAttendees = useMemo(() => {
    return attendeeItems.filter((item) => {
      // Tab filter
      if (activeTab === "attending" && item.status !== "attending") return false;
      if (activeTab === "pending" && item.status !== "pending") return false;
      if (activeTab === "declined" && item.status !== "declined") return false;

      // Cohort type filter
      if (selectedCohortType !== "all" && item.type !== selectedCohortType) return false;

      // Family filter
      if (selectedFamilyId !== "all") {
        const fam = families.find((f) => f.id === selectedFamilyId);
        if (!fam || !item.affiliation.toLowerCase().includes(fam.familyName.toLowerCase())) {
          return false;
        }
      }

      // Sub-community filter
      if (selectedSubCommunityId !== "all") {
        const sub = subCommunities.find((s) => s.id === selectedSubCommunityId);
        if (!sub || !item.affiliation.toLowerCase().includes(sub.name.toLowerCase())) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.affiliation.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.inviteCode.toLowerCase().includes(q) ||
          item.mealPreference.toLowerCase().includes(q) ||
          item.dietaryNotes.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    attendeeItems,
    activeTab,
    selectedCohortType,
    selectedFamilyId,
    selectedSubCommunityId,
    searchQuery,
    families,
    subCommunities,
  ]);

  // Chart Data for Progress Chart
  const chartData = [
    { name: "Accepted", value: acceptedCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#f59e0b" },
    { name: "Declined", value: declinedCount, color: "#f43f5e" },
  ];

  // Export Action
  const handleExecuteExport = () => {
    if (!event) return;
    setIsExporting(true);

    const itemsToExport = exportScope === "filtered" ? filteredAttendees : attendeeItems;

    const summary: EventExportSummary = {
      eventTitle: event.title,
      eventDate: new Date(event.startDate).toLocaleDateString(undefined, {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      venue: event.location.isVirtual
        ? event.location.meetingUrl || "Online Gathering"
        : `${event.location.name}, ${event.location.address || ""}`,
      totalInvited: totalInvitedCount,
      acceptedCount,
      declinedCount,
      pendingCount,
      totalHeadcount,
      mealBreakdown,
    };

    try {
      if (exportFormat === "excel") {
        exportAttendeesToExcel(itemsToExport, summary, event.title);
      } else {
        exportAttendeesToPdf(itemsToExport, summary, event.title);
      }
      setIsExportDialogOpen(false);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Permission Check Guard
  if (!hasAccess) {
    return (
      <div className="py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="Attendee analytics and full RSVP records are restricted to Event Organizers and Community Administrators."
          action={{
            label: "Return to Event Details",
            onClick: () => router.push(`/events/${eventId}`),
          }}
        />
      </div>
    );
  }

  // Loading Skeleton
  if (isEventLoading || isInvsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  // Error State
  if (isEventError || !event) {
    return (
      <div className="py-16">
        <EmptyState
          icon={AlertCircle}
          title="Event Not Found"
          description="Could not locate event attendee records for the requested gathering."
          action={{
            label: "Back to Events List",
            onClick: () => router.push("/events"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header and Live Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={`/events/${eventId}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-1.5 p-0 h-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {event.title}
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Attendee Intelligence & RSVP Roster
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time RSVP responses, catering breakdown, live auto-polling, and formatted spreadsheet/PDF exports.
          </p>
        </div>

        {/* Live Polling Status & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Polling Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isTabVisible ? "bg-emerald-400" : "bg-zinc-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isTabVisible ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
            </span>
            <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
              {isTabVisible ? "Live Polling (15s)" : "Polling Paused"}
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              • Polled {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              title="Poll latest updates now"
            >
              <RefreshCw className={`h-3 w-3 ${isManualRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>

          {/* Pending Follow-up Trigger */}
          {pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReminderConfirmOpen(true)}
              className="gap-1.5 text-xs h-9 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Send className="h-3.5 w-3.5 text-amber-600" />
              Remind Pending ({pendingCount})
            </Button>
          )}

          {/* Export Report Trigger */}
          <Button
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export Guestlist
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Invited */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Issued</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
            {totalInvitedCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">
            Households & VIPs
          </span>
        </div>

        {/* Confirmed Attending */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Accepted</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {acceptedCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">
            {totalInvitedCount > 0 ? Math.round((acceptedCount / totalInvitedCount) * 100) : 0}% acceptance rate
          </span>
        </div>

        {/* Total Headcount */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <span>Total Headcount</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-2">
            {totalHeadcount}
          </div>
          <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 block font-medium">
            Sum of all attendee +1s
          </span>
        </div>

        {/* Pending Responses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>Awaiting Reply</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">
            {totalInvitedCount > 0 ? Math.round((pendingCount / totalInvitedCount) * 100) : 0}% unconfirmed
          </span>
        </div>

        {/* Declined */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <span>Declined</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {declinedCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">
            {totalInvitedCount > 0 ? Math.round((declinedCount / totalInvitedCount) * 100) : 0}% unable to join
          </span>
        </div>
      </div>

      {/* Analytics & Catering Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recharts Response Distribution Chart */}
        <Card className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Response Progress Distribution
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Live RSVP response ratio across all issued passes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-56 w-full flex items-center justify-center">
              {totalInvitedCount === 0 ? (
                <div className="text-center text-xs text-zinc-400">
                  No invitations issued yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        `${Number(value) || 0} invitations (${
                          totalInvitedCount > 0
                            ? Math.round(((Number(value) || 0) / totalInvitedCount) * 100)
                            : 0
                        }%)`,
                        String(name ?? ""),
                      ]}
                      contentStyle={{
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        color: "#ffffff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Accepted ({acceptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Pending ({pendingCount})</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Declined ({declinedCount})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Catering & Meal Logistics Breakdown */}
        <Card className="lg:col-span-2 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-indigo-600" />
                  Catering & Meal Selections
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 mt-0.5">
                  Confirmed portion quantities prepared for chef and banquet kitchen staffing.
                </CardDescription>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {totalHeadcount} Total Portions
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            {Object.keys(mealBreakdown).length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 border border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20">
                No confirmed banquet meals requested yet. As guests accept their invitations, portion quantities will populate here automatically.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(mealBreakdown).map(([meal, count]) => {
                  const percent = totalHeadcount > 0 ? Math.round((count / totalHeadcount) * 100) : 0;
                  return (
                    <div
                      key={meal}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                          {meal}
                        </span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {count}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium block">
                          {percent}% of confirmed attendees
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dietary & Allergy Alerts */}
            {dietaryAlerts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Special Dietary & Allergy Notices ({dietaryAlerts.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dietaryAlerts.map((d, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800/80 font-medium"
                    >
                      <span className="font-bold">{d.name}:</span> {d.notes}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Attendees Table Card */}
      <Card className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Attendee Directory & Guest Status ({filteredAttendees.length})
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Complete log of invitees with headcounts, dietary choices, and instant follow-up controls.
              </CardDescription>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 text-xs overflow-x-auto self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                All ({totalInvitedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("attending")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === "attending"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Accepted ({acceptedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === "pending"
                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("declined")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === "declined"
                    ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Declined ({declinedCount})
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search by invitee, email, code, meal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-zinc-900"
              />
            </div>

            {/* Filter by Household */}
            <div>
              <select
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
                className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">All Households</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.familyName} Household
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Sub-Community */}
            <div>
              <select
                value={selectedSubCommunityId}
                onChange={(e) => setSelectedSubCommunityId(e.target.value)}
                className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">All Group Circles</option>
                {subCommunities.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAttendees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                No matching attendees found
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No invitees match your current filters. Clear the search input or select another status tab.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFamilyId("all");
                  setSelectedSubCommunityId("all");
                  setSelectedCohortType("all");
                  setActiveTab("all");
                }}
                className="text-xs h-8"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] bg-zinc-50/50 dark:bg-zinc-800/20">
                      <th className="py-3.5 pl-6">Invitee</th>
                      <th className="py-3.5">Household / Group</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5 text-center">Headcount</th>
                      <th className="py-3.5">Meal Selection</th>
                      <th className="py-3.5">Dietary Notes</th>
                      <th className="py-3.5">Responded</th>
                      <th className="py-3.5 text-right pr-6">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {filteredAttendees.map((item, idx) => {
                      const isPending = item.status === "pending";
                      const isResent = resentInviteId === item.inviteCode;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          {/* Invitee */}
                          <td className="py-3.5 pl-6">
                            <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                              {item.email && <span className="truncate max-w-[140px]">{item.email}</span>}
                              <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">
                                {item.inviteCode}
                              </span>
                            </div>
                          </td>

                          {/* Affiliation */}
                          <td className="py-3.5">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {item.affiliation}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5">
                            <StatusBadge status={item.status} />
                          </td>

                          {/* Headcount */}
                          <td className="py-3.5 text-center font-extrabold text-zinc-900 dark:text-zinc-100">
                            {item.status === "attending" ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                {item.attendingCount} guest{item.attendingCount > 1 ? "s" : ""}
                              </span>
                            ) : item.status === "declined" ? (
                              <span className="text-zinc-400">0</span>
                            ) : (
                              <span className="text-zinc-400 italic">Up to {item.allowedGuests}</span>
                            )}
                          </td>

                          {/* Meal */}
                          <td className="py-3.5 max-w-[180px]">
                            {item.mealPreference ? (
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                                {item.mealPreference}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic">—</span>
                            )}
                          </td>

                          {/* Dietary */}
                          <td className="py-3.5 max-w-[140px]">
                            {item.dietaryNotes ? (
                              <span className="text-amber-700 dark:text-amber-300 font-medium truncate block" title={item.dietaryNotes}>
                                {item.dietaryNotes}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic">—</span>
                            )}
                          </td>

                          {/* Responded */}
                          <td className="py-3.5 text-zinc-500 whitespace-nowrap">
                            {item.responseDate || <span className="italic text-zinc-400">Awaiting</span>}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 text-right pr-6 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={resendSingleMutation.isPending}
                                  onClick={() => {
                                    // Look up original invitation
                                    const original = invitations.find((inv) => inv.inviteCode === item.inviteCode);
                                    if (original) resendSingleMutation.mutate(original.id);
                                  }}
                                  className="h-7 text-[11px] px-2.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                                >
                                  {isResent ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600 mr-1" />
                                      Sent!
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      Resend
                                    </>
                                  )}
                                </Button>
                              )}

                              <Link
                                href={`/rsvp/${item.inviteCode}`}
                                target="_blank"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                title="Open Guest RSVP Portal"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800 p-4 space-y-4">
                {filteredAttendees.map((item, idx) => {
                  const isPending = item.status === "pending";

                  return (
                    <div key={idx} className="pt-3 first:pt-0 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-zinc-500">{item.affiliation}</div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Headcount</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {item.status === "attending" ? `${item.attendingCount} Confirmed` : item.status === "declined" ? "0" : `Up to ${item.allowedGuests}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Meal Choice</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                            {item.mealPreference || "None specified"}
                          </span>
                        </div>
                      </div>

                      {item.dietaryNotes && (
                        <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          <span className="font-bold">Dietary:</span> {item.dietaryNotes}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          PASS: {item.inviteCode}
                        </span>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const original = invitations.find((inv) => inv.inviteCode === item.inviteCode);
                                if (original) resendSingleMutation.mutate(original.id);
                              }}
                              className="h-7 text-xs px-2.5"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Resend
                            </Button>
                          )}
                          <Link
                            href={`/rsvp/${item.inviteCode}`}
                            target="_blank"
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                          >
                            Open RSVP →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Configuration Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Export Attendee Roster
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Download complete or filtered guestlist records with headcount metrics and catering requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Format choice */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">File Format</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportFormat("excel")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    exportFormat === "excel"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20 text-emerald-900 dark:text-emerald-100 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600 mb-1" />
                  <div>Excel Workbook (.xlsx)</div>
                  <span className="text-[10px] text-zinc-400 font-normal">Dual sheets: Roster + Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("pdf")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    exportFormat === "pdf"
                      ? "border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-600/20 text-rose-900 dark:text-rose-100 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <FileText className="h-5 w-5 text-rose-600 mb-1" />
                  <div>PDF Document (.pdf)</div>
                  <span className="text-[10px] text-zinc-400 font-normal">Landscape banquet layout</span>
                </button>
              </div>
            </div>

            {/* Scope choice */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">Export Scope</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === "filtered"}
                    onChange={() => setExportScope("filtered")}
                    className="text-indigo-600"
                  />
                  <div>
                    <span className="font-bold block">Current Filtered View ({filteredAttendees.length} entries)</span>
                    <span className="text-[11px] text-zinc-400">Respects active status tab and search criteria</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === "all"}
                    onChange={() => setExportScope("all")}
                    className="text-indigo-600"
                  />
                  <div>
                    <span className="font-bold block">All Issued Invitations ({totalInvitedCount} entries)</span>
                    <span className="text-[11px] text-zinc-400">Full complete guestlist across all cohorts</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExportDialogOpen(false)}
              className="text-xs text-zinc-500"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isExporting}
              onClick={handleExecuteExport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Pending Reminder Dialog */}
      <ConfirmDialog
        open={isReminderConfirmOpen}
        onOpenChange={setIsReminderConfirmOpen}
        title="Send Reminder Notification to Pending Guests?"
        description={`This will dispatch automated follow-up reminders to ${pendingCount} pending invitees across WhatsApp and Email, providing their 1-click personal RSVP links.`}
        confirmLabel="Send Reminders"
        cancelLabel="Keep Waiting"
        isLoading={sendRemindersMutation.isPending}
        onConfirm={async () => {
          await sendRemindersMutation.mutateAsync();
        }}
      />
    </div>
  );
}

export default function AttendeesPage({ params }: AttendeesPageProps) {
  const unwrappedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <AttendeeReportContent eventId={unwrappedParams.id} />
    </Suspense>
  );
}
