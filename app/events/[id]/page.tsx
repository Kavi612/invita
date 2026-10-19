"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/use-auth";
import { can } from "@/lib/permissions";
import { Event, Invitation, RSVP } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Can } from "@/components/shared/Can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EventFormDialog, EventFormValues } from "@/components/events/EventFormDialog";
import { InviteeSelectorModal } from "@/components/events/InviteeSelectorModal";
import { SendInvitationsDialog } from "@/components/events/SendInvitationsDialog";
import { EventRemindersCard } from "@/components/events/EventRemindersCard";
import { EventLiveStreamCard } from "@/components/events/EventLiveStreamCard";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Users,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Shield,
  Layers,
  Home,
  User,
  HeartHandshake,
  Mail,
  Phone,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

function EventDetailContent({ eventId }: { eventId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentRole, activeCommunityId } = useAuthStore();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSendInvitationsOpen, setIsSendInvitationsOpen] = useState(false);
  const [inviteeFilter, setInviteeFilter] = useState<
    "all" | "family" | "sub_community" | "individual" | "outside_guest"
  >("all");
  const [inviteeSearch, setInviteeSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCopiedShareLink, setIsCopiedShareLink] = useState(false);

  // Fetch Event
  const {
    data: event,
    isLoading: isEventLoading,
    isError: isEventError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.events.getById(eventId),
  });

  // Fetch Invitations for this event
  const {
    data: invitations = [],
    isLoading: isInvLoading,
  } = useQuery({
    queryKey: ["invitations", eventId],
    queryFn: () => api.invitations.list(eventId),
  });

  // Fetch RSVPs for this event
  const {
    data: rsvps = [],
    isLoading: isRsvpLoading,
  } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: () => api.rsvps.list(eventId),
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: (values: EventFormValues) => {
      const locationObj = values.isVirtual
        ? {
            name: values.meetingPlatform || "Virtual Gathering",
            address: "Online Meeting Link",
            isVirtual: true,
            meetingUrl: values.meetingUrl,
          }
        : {
            name: values.venueName || "Community Center",
            address: values.venueAddress || "",
            city: values.venueCity || "",
            mapUrl: values.venueMapUrl || "",
            isVirtual: false,
          };

      return api.events.update(eventId, {
        title: values.title,
        description: values.description,
        type: values.type,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        rsvpDeadline: values.rsvpDeadline ? new Date(values.rsvpDeadline).toISOString() : undefined,
        location: locationObj,
        coverImage: values.coverImage,
        status: values.status,
        visibility: values.visibility,
        maxAttendees: values.maxAttendees,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: (invId: string) => api.invitations.delete(invId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedShareLink(true);
      setTimeout(() => setIsCopiedShareLink(false), 2000);
    }
  };

  if (isEventLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isEventError || !event) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertCircle}
          title="Event Not Found"
          description="The event you are searching for does not exist or has been removed from the registry."
          action={{
            label: "Return to Events List",
            onClick: () => router.push("/events"),
          }}
        />
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const rsvpDeadline = event.rsvpDeadline ? new Date(event.rsvpDeadline) : null;

  // Stats
  const totalInvited = event.guestStats?.totalInvited || invitations.length;
  const attendingCount = event.guestStats?.attending || 0;
  const declinedCount = event.guestStats?.declined || 0;
  const tentativeCount = event.guestStats?.tentative || 0;
  const pendingCount = event.guestStats?.pending || Math.max(0, totalInvited - attendingCount - declinedCount - tentativeCount);

  const attendingPercent = totalInvited > 0 ? Math.round((attendingCount / totalInvited) * 100) : 0;
  const declinedPercent = totalInvited > 0 ? Math.round((declinedCount / totalInvited) * 100) : 0;
  const pendingPercent = totalInvited > 0 ? Math.round((pendingCount / totalInvited) * 100) : 0;

  // Filtered invitations list
  const filteredInvitations = invitations.filter((inv) => {
    const matchesCategory =
      inviteeFilter === "all" || inv.recipientType === inviteeFilter;
    const matchesSearch =
      inv.recipientName.toLowerCase().includes(inviteeSearch.toLowerCase()) ||
      (inv.recipientEmail || "").toLowerCase().includes(inviteeSearch.toLowerCase()) ||
      inv.inviteCode.toLowerCase().includes(inviteeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="gap-1.5 text-xs h-9"
          >
            {isCopiedShareLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied Link!
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Share Event
              </>
            )}
          </Button>

          {/* Invitee selection button (Only Community Admin and above) */}
          <Can action="event:create">
            <Button
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Guests
            </Button>
          </Can>

          {/* Send Invitations Dialog Button (Visible to invitation:send roles) */}
          <Can action="invitation:send">
            <Button
              size="sm"
              onClick={() => setIsSendInvitationsOpen(true)}
              className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Send Invitations
            </Button>
          </Can>

          {/* Attendee Report Link (Restricted to roles that can manage RSVPs/events) */}
          <Can action="rsvp:view_all">
            <Link href={`/events/${eventId}/attendees`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <Users className="h-3.5 w-3.5" />
                Attendee Report
              </Button>
            </Link>
          </Can>

          {/* Post-Event Media Gallery Link */}
          <Can action="media:view">
            <Link href={`/events/${eventId}/media`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Celebration Gallery
              </Button>
            </Link>
          </Can>

          {/* Edit Event button (Only Community Admin and above) */}
          <Can action="event:edit">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Event
            </Button>
          </Can>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-md bg-zinc-950">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-950 to-slate-900" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Overlay Info */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col justify-end text-white space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white">
                {event.type}
              </span>
              <StatusBadge status={event.status} />
              {event.visibility && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/80 backdrop-blur-md text-zinc-300 border border-zinc-700/60 capitalize">
                  {event.visibility.replace("_", " ")} access
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {event.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl line-clamp-2 drop-shadow-sm">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {/* Details & Logistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date & Schedule */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                Schedule & Time
              </span>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {startDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h4>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 pt-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">Starts:</span>
              <span className="font-semibold">
                {startDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Concludes:</span>
              <span className="font-semibold">
                {endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {rsvpDeadline && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <span>RSVP Deadline:</span>
                <span>
                  {rsvpDeadline.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Location & Map/Link */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                event.location.isVirtual
                  ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600"
                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
              }`}
            >
              {event.location.isVirtual ? (
                <Video className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                {event.location.isVirtual ? "Virtual Event Meeting" : "Gathering Venue"}
              </span>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {event.location.name}
              </h4>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {event.location.isVirtual
                ? "Online video meeting link configured for this gathering."
                : `${event.location.address}${event.location.city ? `, ${event.location.city}` : ""}`}
            </p>

            {event.location.isVirtual ? (
              event.location.meetingUrl ? (
                <a
                  href={event.location.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline pt-1"
                >
                  Join Virtual Room <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-zinc-400 italic text-[11px]">Meeting URL pending</span>
              )
            ) : (
              event.location.mapUrl && (
                <a
                  href={event.location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                >
                  View on Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              )
            )}
          </div>
        </div>

        {/* Host & Capacity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                Organized By & Capacity
              </span>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {event.organizerName || "Community Committee"}
              </h4>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 pt-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Enrolled Capacity:</span>
              <span className="font-semibold">
                {event.maxAttendees ? `${event.maxAttendees} Guests max` : "Uncapped / Open"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Confirmed Attendees:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {attendingCount} confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream Broadcast Section */}
      <EventLiveStreamCard event={event} invitations={invitations} />

      {/* Invitee Summary & Attendance Dashboard */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Invitee Summary & RSVP Progress
          </h2>
          <p className="text-xs text-zinc-500">
            Track issued invitations across community circles, households, and outside guests.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Invited
            </span>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
              {totalInvited}
            </div>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              across {invitations.length} invite units
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Attending (Yes)
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {attendingCount}
            </div>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              {attendingPercent}% confirmation rate
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider block">
              Pending Response
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </div>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              {pendingPercent}% awaiting RSVP
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Declined (No)
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {declinedCount}
            </div>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              {declinedPercent}% unable to attend
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              RSVP Distribution Breakdown
            </span>
            <span className="text-zinc-500">
              {attendingCount} attending • {pendingCount} pending • {declinedCount} declined
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
            <div
              style={{ width: `${attendingPercent}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Attending: ${attendingPercent}%`}
            />
            <div
              style={{ width: `${pendingPercent}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`Pending: ${pendingPercent}%`}
            />
            <div
              style={{ width: `${declinedPercent}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Declined: ${declinedPercent}%`}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-400">
              Total Confirmed Attending:{" "}
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                {attendingCount}
              </span>
            </span>
            <Can action="rsvp:view_all">
              <Link
                href={`/events/${eventId}/attendees`}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full Attendee Report & Exports</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Can>
          </div>
        </div>

        {/* Invitations Table & Guest List */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Issued Invitations ({invitations.length})
              </h3>
              <p className="text-xs text-zinc-500">
                Full list of households, group delegates, members, and outside guests with unique invite passes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Can action="invitation:send">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSendInvitationsOpen(true)}
                  className="gap-1.5 text-xs h-8 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Invites
                </Button>
              </Can>

              <Can action="event:create">
                <Button
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add More Invitees
                </Button>
              </Can>
            </div>
          </div>

          {/* Filter & Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Category tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs overflow-x-auto">
              <button
                onClick={() => setInviteeFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  inviteeFilter === "all"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                All ({invitations.length})
              </button>
              <button
                onClick={() => setInviteeFilter("family")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  inviteeFilter === "family"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Households
              </button>
              <button
                onClick={() => setInviteeFilter("sub_community")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  inviteeFilter === "sub_community"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Sub-Communities
              </button>
              <button
                onClick={() => setInviteeFilter("individual")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  inviteeFilter === "individual"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Individuals
              </button>
              <button
                onClick={() => setInviteeFilter("outside_guest")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  inviteeFilter === "outside_guest"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Outside Guests
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search by invitee or code..."
                value={inviteeSearch}
                onChange={(e) => setInviteeSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          {filteredInvitations.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20">
              <p className="text-xs text-zinc-500">
                No invitations matching your current filter. Click "Add More Invitees" to issue passes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 pl-1">Recipient</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3 text-center">Allowed +1s</th>
                    <th className="pb-3">Invite Code</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredInvitations.map((inv) => {
                    const isCopied = copiedCode === inv.id;

                    const getTypeBadge = () => {
                      switch (inv.recipientType) {
                        case "family":
                          return {
                            label: "Household",
                            icon: Home,
                            style: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200",
                          };
                        case "sub_community":
                          return {
                            label: "Group Delegate",
                            icon: Layers,
                            style: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200",
                          };
                        case "outside_guest":
                          return {
                            label: "Outside Guest",
                            icon: ExternalLink,
                            style: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200",
                          };
                        default:
                          return {
                            label: "Member",
                            icon: User,
                            style: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200",
                          };
                      }
                    };

                    const typeInfo = getTypeBadge();
                    const TypeIcon = typeInfo.icon;

                    return (
                      <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 pl-1">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {inv.recipientName}
                          </div>
                          {inv.customMessage && (
                            <p className="text-[11px] text-zinc-400 italic line-clamp-1 max-w-xs mt-0.5">
                              "{inv.customMessage}"
                            </p>
                          )}
                        </td>

                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeInfo.style}`}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {typeInfo.label}
                          </span>
                        </td>

                        <td className="py-3 text-zinc-600 dark:text-zinc-400">
                          {inv.recipientEmail ? (
                            <span className="block truncate max-w-[160px]">{inv.recipientEmail}</span>
                          ) : inv.recipientPhone ? (
                            <span>{inv.recipientPhone}</span>
                          ) : (
                            <span className="text-zinc-400 italic">No direct email</span>
                          )}
                        </td>

                        <td className="py-3 text-center font-bold text-zinc-800 dark:text-zinc-200">
                          {inv.allowedGuestsCount}
                        </td>

                        <td className="py-3">
                          <button
                            onClick={() => copyToClipboard(inv.inviteCode, inv.id)}
                            className="font-mono text-[11px] px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-1.5"
                            title="Click to copy invite code"
                          >
                            <span>{inv.inviteCode}</span>
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-zinc-400" />
                            )}
                          </button>
                        </td>

                        <td className="py-3">
                          <StatusBadge status={inv.status} />
                        </td>

                        <td className="py-3 text-right pr-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/rsvp/${inv.token || inv.inviteCode}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                              title="Preview Public RSVP Page for this guest"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">RSVP Link</span>
                            </Link>

                            <Can action="event:create">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteInvitationMutation.mutate(inv.id)}
                                className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Revoke Invitation"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </Can>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notification Reminders Automation Section */}
        <EventRemindersCard eventId={event.id} eventTitle={event.title} />
      </div>

      {/* Edit Event Form Dialog */}
      <EventFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        event={event}
        communityId={event.communityId}
        onSubmit={async (values) => {
          await updateEventMutation.mutateAsync(values);
        }}
      />

      {/* Invitee Selector Modal */}
      <InviteeSelectorModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        event={event}
        communityId={event.communityId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["invitations", eventId] });
          queryClient.invalidateQueries({ queryKey: ["event", eventId] });
        }}
      />

      {/* Send Invitations Dialog */}
      <SendInvitationsDialog
        open={isSendInvitationsOpen}
        onOpenChange={setIsSendInvitationsOpen}
        event={event}
        invitations={invitations}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["invitations", eventId] });
          queryClient.invalidateQueries({ queryKey: ["event", eventId] });
        }}
      />
    </div>
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <EventDetailContent eventId={unwrappedParams.id} />
    </Suspense>
  );
}
