"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/use-auth";
import { can } from "@/lib/permissions";
import { Event, EventType, EventStatus } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Can } from "@/components/shared/Can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EventFormDialog, EventFormValues } from "@/components/events/EventFormDialog";
import { InviteeSelectorModal } from "@/components/events/InviteeSelectorModal";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Plus,
  Search,
  Filter,
  Users,
  Edit2,
  Trash2,
  Share2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Shield,
  CheckCircle2,
  Globe,
  Lock,
  UserPlus,
} from "lucide-react";

import { toast } from "@/components/ui/toast";

export default function EventsPage() {
  const queryClient = useQueryClient();
  const { activeCommunityId, currentRole } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "drafts">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "venue" | "virtual">("all");

  // Modals state
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null);
  const [isInviteeModalOpen, setIsInviteeModalOpen] = useState(false);
  const [selectedEventForInvite, setSelectedEventForInvite] = useState<Event | null>(null);

  // Fetch events
  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events", activeCommunityId],
    queryFn: () => api.events.list(activeCommunityId),
  });

  // Create event mutation
  const createEventMutation = useMutation({
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

      return api.events.create({
        communityId: activeCommunityId || "comm-1",
        title: values.title,
        description: values.description,
        type: values.type,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        rsvpDeadline: values.rsvpDeadline ? new Date(values.rsvpDeadline).toISOString() : undefined,
        location: locationObj,
        coverImage: values.coverImage,
        organizerId: "user-2",
        organizerName: "Marcus Vance",
        status: values.status,
        visibility: values.visibility,
        maxAttendees: values.maxAttendees,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event Created", "The new event has been successfully scheduled.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Create Event", msg);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EventFormValues }) => {
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

      return api.events.update(id, {
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
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event Updated", "Gathering details have been successfully saved.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Update Event", msg);
    },
  });

  const handleFormSubmit = async (values: EventFormValues) => {
    if (selectedEventForEdit) {
      await updateEventMutation.mutateAsync({
        id: selectedEventForEdit.id,
        values,
      });
    } else {
      await createEventMutation.mutateAsync(values);
    }
    setIsEventDialogOpen(false);
    setSelectedEventForEdit(null);
  };

  // Group events into categories: Upcoming, Past, Drafts
  const now = new Date().getTime();

  const drafts = events.filter((e) => e.status === "draft");
  const pastEvents = events.filter(
    (e) =>
      e.status === "completed" ||
      (e.status !== "draft" && new Date(e.endDate).getTime() < now)
  );
  const upcomingEvents = events.filter(
    (e) =>
      e.status !== "draft" &&
      e.status !== "completed" &&
      e.status !== "cancelled" &&
      new Date(e.endDate).getTime() >= now
  );

  // Active list based on selected tab
  const tabEvents =
    activeTab === "upcoming"
      ? upcomingEvents
      : activeTab === "past"
      ? pastEvents
      : drafts;

  // Apply filters
  const filteredEvents = tabEvents.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.location.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.location.city || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || ev.type === typeFilter;
    const matchesFormat =
      formatFilter === "all" ||
      (formatFilter === "virtual" && ev.location.isVirtual) ||
      (formatFilter === "venue" && !ev.location.isVirtual);

    return matchesSearch && matchesType && matchesFormat;
  });

  const canCreateOrEdit = can(currentRole, "event:create");

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Events & Celebrations"
        description="Schedule galas, weddings, cultural milestones, and coordinate invitations and guest RSVPs."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events Registry" },
        ]}
        actions={
          <Can
            action="event:create"
            fallback={
              <div className="text-xs text-zinc-400 italic flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Shield className="h-3.5 w-3.5" />
                <span>Admin permissions required to create events</span>
              </div>
            }
          >
            <Button
              onClick={() => {
                setSelectedEventForEdit(null);
                setIsEventDialogOpen(true);
              }}
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Can>
        }
      />

      {/* Tabs and Filter Bar */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200/90 dark:border-zinc-800 overflow-x-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "upcoming"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Upcoming Events
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "upcoming"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {upcomingEvents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("past")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "past"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Clock className="h-4 w-4" />
              Past Celebrations
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "past"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {pastEvents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("drafts")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "drafts"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Edit2 className="h-4 w-4" />
              Drafts & In-Progress
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "drafts"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {drafts.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search events by title, description, venue, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Event Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs capitalize text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="wedding">Weddings</option>
              <option value="social">Social Galas</option>
              <option value="cultural">Cultural Fests</option>
              <option value="anniversary">Anniversaries</option>
              <option value="birthday">Birthdays</option>
              <option value="conference">Conferences</option>
            </select>

            {/* Format selector */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as "all" | "venue" | "virtual")}
              className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Locations</option>
              <option value="venue">Physical Venues</option>
              <option value="virtual">Virtual / Online</option>
            </select>

            {(searchQuery || typeFilter !== "all" || formatFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setFormatFilter("all");
                }}
                className="h-9 text-xs text-zinc-500 hover:text-zinc-800"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={
            activeTab === "upcoming"
              ? "No Upcoming Events Scheduled"
              : activeTab === "past"
              ? "No Past Events Recorded"
              : "No Draft Events in Progress"
          }
          description={
            activeTab === "upcoming"
              ? "There are currently no events lined up. Click Create Event to schedule a gathering."
              : activeTab === "past"
              ? "Historical events and concluded galas will appear here once archived."
              : "Drafts let you prepare event details and venue logistics before publishing invitations."
          }
          action={
            canCreateOrEdit
              ? {
                  label: "Create New Event",
                  onClick: () => {
                    setSelectedEventForEdit(null);
                    setIsEventDialogOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const startDate = new Date(event.startDate);
            const totalInvited = event.guestStats?.totalInvited || 0;
            const attendingCount = event.guestStats?.attending || 0;
            const rsvpPercent =
              totalInvited > 0 ? Math.round((attendingCount / totalInvited) * 100) : 0;

            return (
              <Card
                key={event.id}
                className="overflow-hidden border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md flex flex-col group"
              >
                {/* Cover Image & Tags */}
                <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {event.coverImage ? (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-violet-800 flex items-center justify-center text-white">
                      <CalendarDays className="h-10 w-10 opacity-40" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {event.type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={event.status} />
                    </div>
                  </div>

                  {/* Bottom Image Info: Date pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold flex items-center gap-1.5 drop-shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
                      {startDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    <span className="text-[11px] text-zinc-300 drop-shadow-sm">
                      {startDate.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  {/* Location Info */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80 text-xs flex items-center gap-2">
                    {event.location.isVirtual ? (
                      <>
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <Video className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 block truncate">
                            {event.location.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 block truncate">
                            Virtual Event Link
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 block truncate">
                            {event.location.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 block truncate">
                            {event.location.city || event.location.address}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* RSVP & Capacity Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        RSVP Responses
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {attendingCount} Confirmed{" "}
                        {totalInvited > 0 && (
                          <span className="text-zinc-400 font-normal">
                            / {totalInvited} Invited
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, rsvpPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                    <Link href={`/events/${event.id}`}>
                      <Button variant="default" size="sm" className="h-8 text-xs gap-1.5">
                        View Event
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Can action="event:create">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEventForInvite(event);
                            setIsInviteeModalOpen(true);
                          }}
                          className="h-8 text-xs gap-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          title="Select Invitees"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Invite
                        </Button>
                      </Can>

                      <Can action="event:edit">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEventForEdit(event);
                            setIsEventDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          title="Edit Event"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Event Dialog */}
      <EventFormDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        event={selectedEventForEdit}
        communityId={activeCommunityId || "comm-1"}
        onSubmit={handleFormSubmit}
      />

      {/* Invitee Selector Modal */}
      {selectedEventForInvite && (
        <InviteeSelectorModal
          open={isInviteeModalOpen}
          onOpenChange={setIsInviteeModalOpen}
          event={selectedEventForInvite}
          communityId={activeCommunityId || "comm-1"}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
          }}
        />
      )}
    </div>
  );
}
