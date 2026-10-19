"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/use-auth";
import { can } from "@/lib/permissions";
import { Event, EventType, EventStatus, EventVisibility } from "@/types";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Globe,
  Lock,
  Users,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { eventFormSchema, EventFormValues } from "@/lib/validations";

export { eventFormSchema };
export type { EventFormValues };

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  communityId?: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
}

const PRESET_COVERS = [
  {
    label: "Gala & Banquet",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80",
  },
  {
    label: "Wedding Nuptials",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1000&auto=format&fit=crop&q=80",
  },
  {
    label: "Cultural Festival",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80",
  },
  {
    label: "Vineyard & Dining",
    url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80",
  },
  {
    label: "Conference & Keynote",
    url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80",
  },
];

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  communityId = "comm-1",
  onSubmit,
}: EventFormDialogProps) {
  const isEditing = !!event;
  const currentRole = useAuthStore((state) => state.currentRole);

  // Permission check: strictly Community Admin and above can create or edit events
  const isAuthorized = isEditing
    ? can(currentRole, "event:edit")
    : can(currentRole, "event:create");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationType, setLocationType] = useState<"venue" | "virtual">(
    event?.location?.isVirtual ? "virtual" : "venue"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      title: "",
      type: "social",
      description: "",
      startDate: "",
      endDate: "",
      rsvpDeadline: "",
      isVirtual: false,
      venueName: "",
      venueAddress: "",
      venueCity: "",
      venueMapUrl: "",
      meetingUrl: "",
      meetingPlatform: "Zoom",
      visibility: "community",
      status: "published",
      coverImage: PRESET_COVERS[0].url,
      maxAttendees: undefined,
    },
  });

  const selectedCover = watch("coverImage");

  useEffect(() => {
    if (event) {
      setLocationType(event.location?.isVirtual ? "virtual" : "venue");
      reset({
        title: event.title,
        type: event.type,
        description: event.description,
        startDate: event.startDate ? event.startDate.substring(0, 16) : "",
        endDate: event.endDate ? event.endDate.substring(0, 16) : "",
        rsvpDeadline: event.rsvpDeadline ? event.rsvpDeadline.substring(0, 16) : "",
        isVirtual: !!event.location?.isVirtual,
        venueName: event.location?.name || "",
        venueAddress: event.location?.address || "",
        venueCity: event.location?.city || "",
        venueMapUrl: event.location?.mapUrl || "",
        meetingUrl: event.location?.meetingUrl || "",
        meetingPlatform: event.location?.meetingUrl ? "Virtual" : "Zoom",
        visibility: event.visibility || "community",
        status: event.status,
        coverImage: event.coverImage || PRESET_COVERS[0].url,
        maxAttendees: event.maxAttendees,
      });
    } else {
      setLocationType("venue");
      // Set sensible defaults for a new event (tomorrow 6pm to 10pm)
      const now = new Date();
      now.setDate(now.getDate() + 7);
      const startIso = new Date(now.setHours(18, 0, 0, 0)).toISOString().substring(0, 16);
      const endIso = new Date(now.setHours(22, 0, 0, 0)).toISOString().substring(0, 16);
      const rsvpIso = new Date(now.setDate(now.getDate() - 3)).toISOString().substring(0, 16);

      reset({
        title: "",
        type: "social",
        description: "",
        startDate: startIso,
        endDate: endIso,
        rsvpDeadline: rsvpIso,
        isVirtual: false,
        venueName: "",
        venueAddress: "",
        venueCity: "",
        venueMapUrl: "",
        meetingUrl: "",
        meetingPlatform: "Zoom",
        visibility: "community",
        status: "published",
        coverImage: PRESET_COVERS[0].url,
        maxAttendees: 150,
      });
    }
  }, [event, open, reset]);

  const onFormSubmit = async (data: EventFormValues) => {
    if (!isAuthorized) return;
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...data,
        isVirtual: locationType === "virtual",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to submit event form", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? "Edit Event" : "Create New Event"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEditing
                  ? "Update schedule, venue, attendance limits, and invitation visibility."
                  : "Organize a new gathering, banquet, or virtual milestone celebration."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Permission Banner Warning if unauthorized */}
        {!isAuthorized && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="font-semibold block">Permission Restricted</strong>
              Only Community Administrators and Super Admins have permission to create or edit events.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 pt-2">
          {/* Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="event-title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Event Title *
              </label>
              <Input
                id="event-title"
                placeholder="e.g. Centennial Summer Gala"
                disabled={!isAuthorized || isSubmitting}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-type" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Event Type *
              </label>
              <select
                id="event-type"
                disabled={!isAuthorized || isSubmitting}
                {...register("type")}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="social">Social Gathering</option>
                <option value="wedding">Wedding / Nuptials</option>
                <option value="anniversary">Anniversary</option>
                <option value="birthday">Birthday Milestone</option>
                <option value="reunion">Family Reunion</option>
                <option value="cultural">Cultural Festival</option>
                <option value="religious">Ceremonial / Religious</option>
                <option value="conference">Conference / Forum</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="event-description" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description & Programme Overview *
            </label>
            <textarea
              id="event-description"
              rows={3}
              placeholder="Outline event agenda, attire code, celebration program, and highlights..."
              disabled={!isAuthorized || isSubmitting}
              {...register("description")}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Date & Time Grid */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              Schedule & Deadlines
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="event-start-date" className="text-[11px] text-zinc-500 block">Start Date & Time *</label>
                <Input
                  id="event-start-date"
                  type="datetime-local"
                  disabled={!isAuthorized || isSubmitting}
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-[10px] text-rose-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="event-end-date" className="text-[11px] text-zinc-500 block">End Date & Time *</label>
                <Input
                  id="event-end-date"
                  type="datetime-local"
                  disabled={!isAuthorized || isSubmitting}
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p className="text-[10px] text-rose-600">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="event-rsvp-deadline" className="text-[11px] text-zinc-500 block">RSVP Deadline</label>
                <Input
                  id="event-rsvp-deadline"
                  type="datetime-local"
                  disabled={!isAuthorized || isSubmitting}
                  {...register("rsvpDeadline")}
                />
              </div>
            </div>
          </div>

          {/* Location Mode Toggle: Physical Venue vs Online */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                {locationType === "venue" ? (
                  <MapPin className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Video className="h-4 w-4 text-indigo-600" />
                )}
                Location Format
              </span>

              <div className="flex rounded-lg p-0.5 bg-zinc-200/80 dark:bg-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLocationType("venue");
                    setValue("isVirtual", false);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    locationType === "venue"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  Physical Venue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocationType("virtual");
                    setValue("isVirtual", true);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    locationType === "virtual"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  Virtual / Online Link
                </button>
              </div>
            </div>

            {locationType === "venue" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="event-venue-name" className="text-[11px] text-zinc-500 block">Venue / Hall Name *</label>
                  <Input
                    id="event-venue-name"
                    placeholder="e.g. The Grand Conservatory"
                    disabled={!isAuthorized || isSubmitting}
                    {...register("venueName")}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-venue-city" className="text-[11px] text-zinc-500 block">City & State</label>
                  <Input
                    id="event-venue-city"
                    placeholder="e.g. Belvedere, CA"
                    disabled={!isAuthorized || isSubmitting}
                    {...register("venueCity")}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-venue-address" className="text-[11px] text-zinc-500 block">Street Address</label>
                  <Input
                    id="event-venue-address"
                    placeholder="e.g. 100 Palace Drive"
                    disabled={!isAuthorized || isSubmitting}
                    {...register("venueAddress")}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-venue-map-url" className="text-[11px] text-zinc-500 block">Google Maps Link (Optional)</label>
                  <Input
                    id="event-venue-map-url"
                    placeholder="https://maps.google.com/..."
                    disabled={!isAuthorized || isSubmitting}
                    {...register("venueMapUrl")}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="event-meeting-platform" className="text-[11px] text-zinc-500 block">Platform</label>
                  <select
                    id="event-meeting-platform"
                    disabled={!isAuthorized || isSubmitting}
                    {...register("meetingPlatform")}
                    className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
                  >
                    <option value="Zoom">Zoom Video</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Webex">Cisco Webex</option>
                    <option value="Custom Stream">Custom Live Stream</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-meeting-url" className="text-[11px] text-zinc-500 block">Meeting Join URL *</label>
                  <Input
                    id="event-meeting-url"
                    placeholder="https://zoom.us/j/123456789 or meet.google.com/..."
                    disabled={!isAuthorized || isSubmitting}
                    {...register("meetingUrl")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visibility & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="event-visibility" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Lock className="h-3 w-3 text-zinc-400" />
                Visibility Settings
              </label>
              <select
                id="event-visibility"
                disabled={!isAuthorized || isSubmitting}
                {...register("visibility")}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="community">Community Members</option>
                <option value="public">Public (Open to All)</option>
                <option value="sub_community">Sub-Community / Group</option>
                <option value="private">Private (Invitees Only)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-status" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Publication Status
              </label>
              <select
                id="event-status"
                disabled={!isAuthorized || isSubmitting}
                {...register("status")}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="published">Published (Accepting RSVPs)</option>
                <option value="draft">Draft (Planning Mode)</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-max-attendees" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Users className="h-3 w-3 text-zinc-400" />
                Capacity / Max Attendees
              </label>
              <Input
                id="event-max-attendees"
                type="number"
                placeholder="Unlimited if empty"
                disabled={!isAuthorized || isSubmitting}
                {...register("maxAttendees")}
              />
            </div>
          </div>

          {/* Cover Image & Presets */}
          <div className="space-y-2">
            <label htmlFor="event-cover-image" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
              Cover Image Preset or URL
            </label>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_COVERS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setValue("coverImage", preset.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border shrink-0 transition-all ${
                    selectedCover === preset.url
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <Input
              id="event-cover-image"
              placeholder="Custom image URL: https://images.unsplash.com/..."
              disabled={!isAuthorized || isSubmitting}
              {...register("coverImage")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isAuthorized || isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Event...
                </>
              ) : isEditing ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
