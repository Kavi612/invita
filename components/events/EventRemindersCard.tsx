"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { ReminderSetting, ReminderType } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Clock,
  Mail,
  MessageCircle,
  Sparkles,
  Check,
  AlertCircle,
  ChevronDown,
  Info,
  Calendar,
  Smartphone,
  Eye,
  Sliders,
} from "lucide-react";

interface EventRemindersCardProps {
  eventId: string;
  eventTitle: string;
}

export function EventRemindersCard({ eventId, eventTitle }: EventRemindersCardProps) {
  const queryClient = useQueryClient();
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Fetch reminder settings for this event
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders", eventId],
    queryFn: () => api.reminders.getSettings(eventId),
  });

  // Mutation to update single reminder
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReminderSetting> }) =>
      api.reminders.updateSetting(eventId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", eventId] });
      toast.success("Reminder Updated", "Notification delivery schedule saved.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Update Reminder", msg);
    },
  });

  const handleToggle = (reminder: ReminderSetting) => {
    updateMutation.mutate({
      id: reminder.id,
      updates: { enabled: !reminder.enabled },
    });
  };

  const handleTimingChange = (reminder: ReminderSetting, newTiming: string) => {
    updateMutation.mutate({
      id: reminder.id,
      updates: { timing: newTiming },
    });
  };

  const handleChannelChange = (
    reminder: ReminderSetting,
    newChannel: "email" | "whatsapp" | "both"
  ) => {
    updateMutation.mutate({
      id: reminder.id,
      updates: { channel: newChannel },
    });
  };

  const getTimingOptions = (type: ReminderType) => {
    switch (type) {
      case "after_rsvp":
        return ["immediately", "5 minutes after"];
      case "before_event":
        return ["1 hour before", "2 hours before", "24 hours before", "48 hours before", "7 days before"];
      case "on_change":
        return ["immediately", "batched hourly"];
      default:
        return ["24 hours before"];
    }
  };

  const getReminderSampleText = (reminder: ReminderSetting) => {
    switch (reminder.type) {
      case "after_rsvp":
        return `✅ RSVP Confirmed for ${eventTitle}! Your digital pass and calendar invite are saved. Present your QR code upon arrival.`;
      case "before_event":
        return `⏳ Reminder: ${eventTitle} begins ${reminder.timing}! Venue parking instructions and table assignments are now available.`;
      case "on_change":
        return `📢 Notice: An update was made to ${eventTitle}. Please check the latest venue directions and revised schedule.`;
      default:
        return `Notification from Invita for ${eventTitle}`;
    }
  };

  return (
    <Card className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Notification & Reminder Automation
                </CardTitle>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  UI Simulation
                </span>
              </div>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Automated multi-channel delivery schedule for confirmed attendees and invited households.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 self-start sm:self-auto">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Delivery Engine Ready</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reminders.map((reminder) => {
              const timingOptions = getTimingOptions(reminder.type);
              const isPreviewOpen = activePreviewId === reminder.id;

              return (
                <div
                  key={reminder.id}
                  className={`py-4 first:pt-0 last:pb-0 transition-colors ${
                    !reminder.enabled ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Info & Toggle */}
                    <div className="flex items-start gap-3">
                      {/* Checkbox toggle switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(reminder)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 mt-0.5 ${
                          reminder.enabled
                            ? "bg-indigo-600"
                            : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                        title={reminder.enabled ? "Disable this reminder" : "Enable this reminder"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            reminder.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {reminder.title}
                          </h4>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-semibold uppercase ${
                              reminder.enabled
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {reminder.enabled ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 max-w-md">
                          {reminder.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Controls (Timing, Channel, Sample Preview) */}
                    <div className="flex items-center gap-2 flex-wrap pl-14 sm:pl-0">
                      {/* Timing Selector */}
                      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <select
                          value={reminder.timing}
                          onChange={(e) => handleTimingChange(reminder, e.target.value)}
                          disabled={!reminder.enabled}
                          className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer capitalize"
                        >
                          {timingOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Channel Selector */}
                      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs">
                        <button
                          type="button"
                          onClick={() => handleChannelChange(reminder, "whatsapp")}
                          disabled={!reminder.enabled}
                          className={`p-1.5 rounded-lg transition-all ${
                            reminder.channel === "whatsapp"
                              ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs font-bold"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                          title="WhatsApp delivery"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChannelChange(reminder, "email")}
                          disabled={!reminder.enabled}
                          className={`p-1.5 rounded-lg transition-all ${
                            reminder.channel === "email"
                              ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-xs font-bold"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                          title="Email delivery"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChannelChange(reminder, "both")}
                          disabled={!reminder.enabled}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            reminder.channel === "both"
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                          title="Deliver to both Email and WhatsApp"
                        >
                          Both
                        </button>
                      </div>

                      {/* Preview toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setActivePreviewId((prev) => (prev === reminder.id ? null : reminder.id))
                        }
                        className="h-7 px-2 text-[11px] gap-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        <Eye className="h-3 w-3" />
                        {isPreviewOpen ? "Hide" : "Preview"}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Preview Bubble */}
                  {isPreviewOpen && (
                    <div className="mt-3 ml-0 sm:ml-14 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                        <span>Simulated {reminder.channel.toUpperCase()} Dispatch:</span>
                        <span>Timing: {reminder.timing}</span>
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200 font-medium italic">
                        &ldquo;{getReminderSampleText(reminder)}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
          <span>
            Reminder schedules are calculated dynamically from the event start time. In preview/sandbox mode, schedules trigger mocked log dispatches without cellular SMS carrier fees.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
