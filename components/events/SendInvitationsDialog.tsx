"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Event, Invitation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Users,
  Home,
  Layers,
  ExternalLink,
  Sparkles,
  Calendar,
  Loader2,
  ShieldCheck,
  MessageCircle,
  Smartphone,
} from "lucide-react";

interface SendInvitationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  invitations: Invitation[];
  onSuccess?: () => void;
}

export function SendInvitationsDialog({
  open,
  onOpenChange,
  event,
  invitations,
  onSuccess,
}: SendInvitationsDialogProps) {
  const queryClient = useQueryClient();

  // Channel choice: email | whatsapp | both
  const [channel, setChannel] = useState<"email" | "whatsapp" | "both">("both");
  const [previewTab, setPreviewTab] = useState<"whatsapp" | "email">("whatsapp");
  const [selectedTarget, setSelectedTarget] = useState<"all" | "unsent" | "failed">("all");
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [isCopiedSampleLink, setIsCopiedSampleLink] = useState(false);

  // Filter target invitations
  const targetInvitations = invitations.filter((inv) => {
    if (selectedTarget === "unsent") {
      return inv.status !== "sent" && inv.status !== "delivered" && inv.status !== "responded";
    }
    return true;
  });

  // Recipient breakdown counts
  const familyCount = targetInvitations.filter((i) => i.recipientType === "family").length;
  const subCommunityCount = targetInvitations.filter((i) => i.recipientType === "sub_community").length;
  const individualCount = targetInvitations.filter((i) => i.recipientType === "individual").length;
  const outsideGuestCount = targetInvitations.filter((i) => i.recipientType === "outside_guest").length;
  const totalRecipients = targetInvitations.length;
  const totalGuests = targetInvitations.reduce((sum, i) => sum + (i.allowedGuestsCount || 1), 0);

  // Sample recipient for live preview
  const sampleRecipient = targetInvitations[0] || {
    recipientName: "Honored Guest",
    allowedGuestsCount: 2,
    token: "tok_sample_preview",
    inviteCode: "INV-PREVIEW-99",
  };

  const sampleToken = sampleRecipient.token || "tok_preview_" + (sampleRecipient.id || "sample");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://invita.app";
  const sampleRsvpUrl = `${baseUrl}/rsvp/${sampleToken}`;

  const eventDateStr = new Date(event.startDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const eventTimeStr = new Date(event.startDate).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const locationStr = event.location.isVirtual
    ? `Virtual Gathering: ${event.location.name || "Online Meeting"}`
    : `${event.location.name}, ${event.location.address || event.location.city || ""}`;

  // Send Mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      return api.invitations.sendInvitations(event.id, {
        channel,
        invitationIds: targetInvitations.map((i) => i.id),
      });
    },
    onSuccess: (res) => {
      setSentCount(res.sentCount);
      setSendSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["invitations", event.id] });
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      toast.success(
        "Invitations Dispatched",
        `Successfully sent ${res.sentCount} invitation(s) via ${channel === "both" ? "Email & WhatsApp" : channel}.`
      );
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Send Invitations", msg);
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sampleRsvpUrl);
    setIsCopiedSampleLink(true);
    setTimeout(() => setIsCopiedSampleLink(false), 2000);
  };

  const handleResetAndClose = () => {
    setSendSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleResetAndClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Dispatch Digital Invitations
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Send personalized invitations with unique RSVP passes via Email & WhatsApp.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {sendSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Invitations Successfully Dispatched!
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {sentCount} personalized invitation passes
                </span>{" "}
                were queued and dispatched across{" "}
                <span className="font-semibold capitalize">
                  {channel === "both" ? "Email and WhatsApp" : channel}
                </span>{" "}
                channels with unique secure RSVP tokens.
              </p>
            </div>

            {/* Dispatched Summary Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-left max-w-lg mx-auto space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Passcode Verification:
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Active & Stored
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Target Event:
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]">
                  {event.title}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <ExternalLink className="h-4 w-4 text-amber-600" />
                  Public RSVP Route:
                </span>
                <span className="font-mono text-[11px] text-zinc-500">/rsvp/[unique-token]</span>
              </div>
            </div>

            {/* Sample link test button */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 text-xs h-9"
              >
                {isCopiedSampleLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied Sample Link!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Sample RSVP Link
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleResetAndClose}
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs h-9 px-5"
              >
                Done & Return
              </Button>
            </div>
          </div>
        ) : (
          /* Dispatch Configuration Form */
          <div className="p-6 space-y-6">
            {/* Step 1: Channel Choice */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center text-[10px] font-extrabold">
                    1
                  </span>
                  Select Dispatch Channel
                </label>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Multi-channel redundancy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Email Option */}
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    channel === "email"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    {channel === "email" && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    Email Only
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                    Custom HTML invitations delivered to inbox
                  </p>
                </button>

                {/* WhatsApp Option */}
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    channel === "whatsapp"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    {channel === "whatsapp" && (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    WhatsApp Only
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                    Direct instant chat dispatch with 1-tap links
                  </p>
                </button>

                {/* Both Option */}
                <button
                  type="button"
                  onClick={() => setChannel("both")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    channel === "both"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    {channel === "both" && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    Both Channels
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                    Maximum delivery rate & attendee convenience
                  </p>
                </button>
              </div>
            </div>

            {/* Step 2: Recipient Summary Breakdown */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Recipient Cohort Summary ({totalRecipients} Invites / {totalGuests} Potential Guests)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Ready to Dispatch
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <Home className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{familyCount}</div>
                    <div className="text-[10px] text-zinc-500">Households</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{subCommunityCount}</div>
                    <div className="text-[10px] text-zinc-500">Group Circles</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{individualCount}</div>
                    <div className="text-[10px] text-zinc-500">Members</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{outsideGuestCount}</div>
                    <div className="text-[10px] text-zinc-500">Outside VIPs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Message Preview Per Channel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center text-[10px] font-extrabold">
                    2
                  </span>
                  Message Template Preview
                </label>

                {/* Preview Channel Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("whatsapp")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      previewTab === "whatsapp"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    <Smartphone className="h-3 w-3 text-emerald-600" />
                    WhatsApp Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("email")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      previewTab === "email"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    <Mail className="h-3 w-3 text-indigo-600" />
                    Email Layout
                  </button>
                </div>
              </div>

              {/* Preview Containers */}
              {previewTab === "whatsapp" ? (
                /* WhatsApp Message Simulation */
                <div className="p-4 rounded-2xl bg-emerald-950/10 dark:bg-emerald-950/30 border border-emerald-500/20 max-w-lg mx-auto space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] pb-1 border-b border-emerald-500/10">
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Business Template: Invita Gathering Pass
                  </div>

                  <div className="p-3.5 rounded-2xl rounded-tl-xs bg-emerald-50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-zinc-800 dark:text-zinc-200 space-y-2 shadow-xs">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      ✨ You are cordially invited to:
                    </p>
                    <h4 className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400">
                      {event.title}
                    </h4>

                    <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300 border-l-2 border-emerald-500 pl-2 py-0.5">
                      <div>
                        📅 <span className="font-semibold">{eventDateStr}</span> at {eventTimeStr}
                      </div>
                      <div>
                        📍 <span className="font-semibold">{locationStr}</span>
                      </div>
                      <div>
                        👥 Prepared for: <span className="font-bold text-zinc-900 dark:text-zinc-100">{sampleRecipient.recipientName}</span> (Up to {sampleRecipient.allowedGuestsCount} guests)
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 italic">
                      Please confirm your attendance, guest count, and meal preferences using your personal RSVP pass below:
                    </p>

                    <div className="pt-1">
                      <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] break-all flex items-center justify-between">
                        <span>{sampleRsvpUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 ml-1 text-zinc-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Layout Simulation */
                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-[11px] text-zinc-500 font-medium pb-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
                    <span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">Subject:</span> Invitation: {event.title}
                    </span>
                    <span className="text-[10px] text-zinc-400">Sender: notifications@invita.org</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {event.type}
                      </span>
                      <span className="text-zinc-400 text-[11px]">• Community Gathering</span>
                    </div>

                    <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                      {event.title}
                    </h4>

                    <p className="text-zinc-600 dark:text-zinc-300 text-xs">
                      Dear <span className="font-bold">{sampleRecipient.recipientName}</span>, you are cordially invited to attend {event.title}. We have reserved seats for up to {sampleRecipient.allowedGuestsCount} guests for your household.
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-[11px]">
                      <div>
                        <span className="text-zinc-400 block">Date & Time</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {eventDateStr} • {eventTimeStr}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">Location</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                          {locationStr}
                        </span>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <div className="inline-block px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm">
                        Accept or Decline Invitation
                      </div>
                      <span className="block text-[10px] text-zinc-400 mt-1 font-mono">
                        {sampleRsvpUrl}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message if Send Mutation Fails */}
            {sendMutation.isError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Failed to dispatch invitations. Please try again or check recipient connectivity.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-4 px-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetAndClose}
            disabled={sendMutation.isPending}
            className="text-xs text-zinc-500"
          >
            Cancel
          </Button>

          {!sendSuccess && (
            <Button
              type="button"
              size="sm"
              disabled={sendMutation.isPending || totalRecipients === 0}
              onClick={() => sendMutation.mutate()}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Dispatching ({totalRecipients})...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Confirm & Send Invitations ({totalRecipients})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
