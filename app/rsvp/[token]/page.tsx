"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Share2,
  Sparkles,
  Users,
  Utensils,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Edit3,
  Heart,
  Loader2,
  ShieldCheck,
  CalendarPlus,
  RefreshCw,
  Home,
  Check,
  Copy,
} from "lucide-react";

interface PublicRsvpPageProps {
  params: Promise<{ token: string }>;
}

const MEAL_OPTIONS = [
  {
    id: "salmon",
    name: "Pan-Seared Atlantic Salmon",
    description: "Served with wild asparagus, fingerling potatoes, and lemon dill emulsion (GF)",
    tag: "Gluten-Free",
  },
  {
    id: "chicken",
    name: "Slow-Roasted Herb Chicken",
    description: "Rosemary roasted breast, truffle potato purée, and heirloom glazed carrots",
    tag: "Popular",
  },
  {
    id: "risotto",
    name: "Wild Mushroom & Truffle Risotto",
    description: "Arborio rice, chanterelle mushrooms, aged balsamic drizzle, and fresh herbs (Vegan)",
    tag: "Vegan / Veg",
  },
  {
    id: "lamb",
    name: "Braised Halal Lamb Shank",
    description: "Tender slow-cooked shank, saffron couscous, roasted pine nuts, and mint jus",
    tag: "Halal",
  },
  {
    id: "none",
    name: "Cocktail Reception & Hors d'Oeuvres Only",
    description: "No formal seated banquet meal required",
    tag: "Light",
  },
];

// Helper to format ISO dates for Google Calendar URL (YYYYMMDDTHHMMSSZ)
function formatGoogleCalDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  } catch {
    return "";
  }
}

export default function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { token } = use(params);
  const queryClient = useQueryClient();

  // Fetch invitation, event, and RSVP response by token
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["public-rsvp", token],
    queryFn: () => api.invitations.getByToken(token),
  });

  // Local Form State
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<"attending" | "declined">("attending");
  const [guestCount, setGuestCount] = useState<number>(1);
  const [mealPreference, setMealPreference] = useState<string>(MEAL_OPTIONS[0].name);
  const [dietaryRequirements, setDietaryRequirements] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isCopiedShare, setIsCopiedShare] = useState(false);

  // Sync state once data loads
  const [hasInitialized, setHasInitialized] = useState(false);
  if (data && !hasInitialized) {
    if (data.rsvpResponse) {
      setStatus(data.rsvpResponse.status === "declined" ? "declined" : "attending");
      setGuestCount(data.rsvpResponse.guestCount || 1);
      setMealPreference(data.rsvpResponse.mealPreference || MEAL_OPTIONS[0].name);
      setDietaryRequirements(data.rsvpResponse.dietaryRequirements || "");
      setNotes(data.rsvpResponse.notes || "");
    } else {
      setGuestCount(data.invitation.allowedGuestsCount > 0 ? 1 : 1);
    }
    setHasInitialized(true);
  }

  // RSVP Submission Mutation
  const rsvpMutation = useMutation({
    mutationFn: async () => {
      return api.rsvps.submitRsvp(token, {
        status,
        guestCount,
        mealPreference: status === "attending" ? mealPreference : undefined,
        dietaryRequirements: status === "attending" ? dietaryRequirements : undefined,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-rsvp", token] });
      setIsEditing(false);
      toast.success(
        "RSVP Recorded",
        status === "attending"
          ? "Thank you! Your gathering attendance has been confirmed."
          : "Your response has been noted. We hope to see you at future events!"
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Submit RSVP", msg);
    },
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-indigo-50/20 to-zinc-50 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center animate-spin">
            <Loader2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Retrieving Personal Invitation...
            </h3>
            <p className="text-xs text-zinc-500">
              Verifying security passcode and fetching celebration details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid Token State
  if (isError || !data || !data.invitation || !data.event) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Invitation Not Found
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We could not locate an active invitation matching token{" "}
              <code className="font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                {token}
              </code>
              . The pass code may have expired or been revoked.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/login">
              <Button size="sm" variant="outline" className="w-full text-xs h-9">
                Return to Invita Platform
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { invitation, event, rsvpResponse, isExpired } = data;
  const isResponded = invitation.status === "responded" || !!rsvpResponse;
  const currentStatus = rsvpResponse?.status || (invitation.status === "responded" ? "attending" : null);

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedStartTime = startDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedEndTime = endDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Google Calendar URL construction
  const googleCalStart = formatGoogleCalDate(event.startDate);
  const googleCalEnd = formatGoogleCalDate(event.endDate);
  const eventLocationStr = event.location.isVirtual
    ? event.location.meetingUrl || "Virtual Meeting"
    : `${event.location.name}, ${event.location.address || ""}`;

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${googleCalStart}/${googleCalEnd}&details=${encodeURIComponent(
    `${event.description}\n\nRSVP Passcode: ${invitation.inviteCode}\nAttendee: ${invitation.recipientName}`
  )}&location=${encodeURIComponent(eventLocationStr)}`;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedShare(true);
      setTimeout(() => setIsCopiedShare(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Branding Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pb-2">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              i
            </span>
            <span>INVITA GATHERING PASS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 text-[11px] flex items-center gap-1 shadow-2xs"
              title="Copy RSVP Link"
            >
              {isCopiedShare ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-indigo-950/5">
          {/* Cover Header */}
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-950">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-zinc-950" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white">
                {event.type}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                {event.title}
              </h1>
              <p className="text-xs text-zinc-300 line-clamp-1 drop-shadow-xs">
                {event.description}
              </p>
            </div>
          </div>

          {/* Invitation Personal Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-indigo-50/20 dark:from-zinc-900 dark:to-indigo-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Invitation Pass Issued To
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {invitation.recipientName}
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold shadow-2xs">
                  PASS: {invitation.inviteCode}
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold">
                  Up to {invitation.allowedGuestsCount} Guests
                </span>
              </div>
            </div>

            {invitation.customMessage && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800">
                &ldquo;{invitation.customMessage}&rdquo;
              </p>
            )}
          </div>

          {/* Event Details Grid */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Date & Time */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    Date & Schedule
                  </span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {formattedDate}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {formattedStartTime} – {formattedEndTime}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                  {event.location.isVirtual ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    Venue Location
                  </span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                    {event.location.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {event.location.address || "Location instructions provided upon RSVP"}
                  </div>

                  {event.location.mapUrl && !event.location.isVirtual && (
                    <a
                      href={event.location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                    >
                      <span>Open in Maps</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Expired Banner Notice if Token Expired */}
            {isExpired && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold block">RSVP Deadline Passed</span>
                  <p className="text-[11px] leading-relaxed">
                    The formal deadline for this celebration was{" "}
                    <span className="font-semibold">
                      {event.rsvpDeadline ? new Date(event.rsvpDeadline).toLocaleDateString() : "earlier"}
                    </span>
                    . You may still view event details, but headcount modifications are currently restricted. Please contact{" "}
                    <span className="font-bold">{event.organizerName || "the event host"}</span> directly for late accommodations.
                  </p>
                </div>
              </div>
            )}

            {/* Responded View (When not in editing mode) */}
            {isResponded && !isEditing && (
              <div className="space-y-4 pt-2">
                {currentStatus === "attending" ? (
                  /* Confirmed Attending Box */
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-100">
                            Attendance Confirmed!
                          </h4>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            We look forward to welcoming your party!
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-600 text-white shadow-xs">
                        Attending
                      </span>
                    </div>

                    {/* Breakdown Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-emerald-500/20">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                          Confirmed Guests
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {guestCount} Guest{guestCount > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-emerald-500/20">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                          Meal Selection
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                          {mealPreference || "Chef's Tasting"}
                        </span>
                      </div>
                    </div>

                    {dietaryRequirements && (
                      <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-emerald-500/20 text-xs">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                          Dietary Notes
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300 italic font-medium">
                          {dietaryRequirements}
                        </span>
                      </div>
                    )}

                    {/* Google Calendar & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                      <a
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          type="button"
                          size="sm"
                          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 rounded-2xl shadow-sm"
                        >
                          <CalendarPlus className="h-4 w-4" />
                          Add to Google Calendar
                        </Button>
                      </a>

                      {!isExpired && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="gap-1.5 text-xs h-10 rounded-2xl border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Modify Response
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Declined View */
                  <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                          <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                            Invitation Declined
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            You indicated you are unable to attend this gathering.
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        Declined
                      </span>
                    </div>

                    {notes && (
                      <p className="text-xs text-zinc-500 italic p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                        &ldquo;{notes}&rdquo;
                      </p>
                    )}

                    {!isExpired && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setStatus("attending");
                            setIsEditing(true);
                          }}
                          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-2xl"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Plans Changed? Update to Attending
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Interactive RSVP Form (Shown if not yet responded, or if user clicked Modify) */}
            {(!isResponded || isEditing) && !isExpired && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  rsvpMutation.mutate();
                }}
                className="space-y-6 pt-3"
              >
                {/* Accept / Decline Selection Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Will you be joining us?
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Accept Option */}
                    <button
                      type="button"
                      onClick={() => setStatus("attending")}
                      className={`p-4 rounded-3xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        status === "attending"
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-600/30 text-emerald-900 dark:text-emerald-100 font-extrabold shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      <div className={`p-2 rounded-2xl ${status === "attending" ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">Joyfully Accept</span>
                      <span className="text-[10px] text-zinc-500">I will attend</span>
                    </button>

                    {/* Decline Option */}
                    <button
                      type="button"
                      onClick={() => setStatus("declined")}
                      className={`p-4 rounded-3xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        status === "declined"
                          ? "border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-600/30 text-rose-900 dark:text-rose-100 font-extrabold shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      <div className={`p-2 rounded-2xl ${status === "declined" ? "bg-rose-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                        <XCircle className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">Regretfully Decline</span>
                      <span className="text-[10px] text-zinc-500">Unable to attend</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields on Accept */}
                {status === "attending" && (
                  <div className="space-y-5 p-5 rounded-3xl bg-zinc-50/60 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800">
                    {/* Guest Count Counter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-indigo-600" />
                          Total Attending Headcount
                        </label>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Max {invitation.allowedGuestsCount} guests
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                          disabled={guestCount <= 1}
                          className="h-10 w-10 rounded-2xl p-0 text-base font-extrabold"
                        >
                          -
                        </Button>

                        <div className="flex-1 text-center font-extrabold text-base bg-white dark:bg-zinc-900 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          {guestCount} {guestCount === 1 ? "Person" : "People"}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setGuestCount((c) => Math.min(invitation.allowedGuestsCount || 1, c + 1))}
                          disabled={guestCount >= (invitation.allowedGuestsCount || 1)}
                          className="h-10 w-10 rounded-2xl p-0 text-base font-extrabold"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Meal Preference Selection */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Utensils className="h-4 w-4 text-indigo-600" />
                        Culinary Entrée Selection
                      </label>

                      <div className="space-y-2">
                        {MEAL_OPTIONS.map((meal) => {
                          const isSelected = mealPreference === meal.name;
                          return (
                            <div
                              key={meal.id}
                              onClick={() => setMealPreference(meal.name)}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "border-indigo-600 bg-white dark:bg-zinc-900 ring-2 ring-indigo-600/20 shadow-xs"
                                  : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 hover:border-zinc-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                  {meal.name}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                  {meal.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                                {meal.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dietary Requirements / Allergies */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Dietary Accommodations & Allergies
                      </label>
                      <Input
                        placeholder="e.g. Nut allergy, Celiac gluten-free, Kosher..."
                        value={dietaryRequirements}
                        onChange={(e) => setDietaryRequirements(e.target.value)}
                        className="h-10 text-xs rounded-2xl bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {/* Optional Note to Host */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                    Personal Note to the Hosts (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Leave warm congratulations, well wishes, or arrival notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Error Banner */}
                {rsvpMutation.isError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Failed to register RSVP response. Please try again.</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="flex items-center gap-3 pt-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-zinc-500 h-11 px-4"
                    >
                      Cancel
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={rsvpMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-2xl shadow-md shadow-indigo-600/20"
                  >
                    {rsvpMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting Response...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        {isEditing ? "Save & Update RSVP" : "Confirm & Submit RSVP"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[11px] text-zinc-400 space-y-1 pb-8">
          <p>
            Secured by <span className="font-semibold text-zinc-600 dark:text-zinc-300">Invita Community Engine</span>
          </p>
          <p>For inquiries, please reach out to the event organizers or community secretariat.</p>
        </div>
      </div>
    </div>
  );
}
