"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/hooks/use-auth";
import { can } from "@/lib/permissions";
import { Event, StreamConfig, Invitation } from "@/types";
import { parseYouTubeUrl, getStreamStatus } from "@/lib/youtube";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tv,
  Radio,
  Play,
  Edit2,
  ExternalLink,
  Check,
  AlertCircle,
  Copy,
  Video,
  Sparkles,
  Lock,
  Plus,
  Loader2,
  Share2,
} from "lucide-react";

interface EventLiveStreamCardProps {
  event: Event;
  invitations: Invitation[];
}

export function EventLiveStreamCard({ event, invitations }: EventLiveStreamCardProps) {
  const queryClient = useQueryClient();
  const { currentRole, currentUser } = useAuthStore();

  const isOrganizerOrAdmin = can(currentRole || "guest", "event:edit");

  // Determine if current user is an invited member (or organizer/admin)
  const isInvitedMember =
    isOrganizerOrAdmin ||
    invitations.some(
      (inv) =>
        (currentUser?.id && inv.recipientId === currentUser.id) ||
        (currentUser?.email && inv.recipientEmail === currentUser.email) ||
        (currentUser?.familyId && inv.recipientId === currentUser.familyId) ||
        inv.status === "responded"
    );

  const streamConfig = event.streamConfig;
  const hasStream = !!streamConfig?.embedUrl && streamConfig.isEnabled;

  // Stream badge based on event schedule
  const streamBadge = getStreamStatus(event.startDate, event.endDate);

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(streamConfig?.url || "");
  const [streamTitle, setStreamTitle] = useState(streamConfig?.title || `${event.title} - Live Stream`);
  const [isEnabled, setIsEnabled] = useState(streamConfig?.isEnabled ?? true);
  const [parseResult, setParseResult] = useState(() => parseYouTubeUrl(streamConfig?.url || ""));
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Handle URL input changes with live validation
  const handleUrlChange = (value: string) => {
    setInputUrl(value);
    setParseResult(parseYouTubeUrl(value));
  };

  // Update stream mutation
  const updateStreamMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseYouTubeUrl(inputUrl);
      if (!parsed.isValid) {
        throw new Error(parsed.error || "Invalid YouTube URL");
      }

      const newConfig: StreamConfig = {
        url: parsed.originalUrl,
        embedUrl: parsed.embedUrl,
        title: streamTitle.trim() || `${event.title} Live Broadcast`,
        isEnabled,
        platform: "youtube",
      };

      return api.events.updateStreamConfig(event.id, newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Live Stream Updated", "Broadcast settings have been saved.");
      setIsEditDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Failed to Update Stream", msg);
    },
  });

  const handleCopyStreamLink = () => {
    if (streamConfig?.url) {
      navigator.clipboard.writeText(streamConfig.url);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    }
  };

  // If user is not an organizer/admin and not an invited member, hide or show restricted notice
  if (!isInvitedMember) {
    return (
      <Card className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
          <Lock className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Live Broadcast Restricted
        </h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          The video stream is reserved for confirmed invited members of this gathering.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Live Broadcast & Keynote Stream
                  </CardTitle>
                  {/* Schedule-based badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${streamBadge.badgeStyle}`}
                  >
                    {streamBadge.status === "live" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                    {streamBadge.label}
                  </span>
                </div>
                <CardDescription className="text-xs text-zinc-500 mt-0.5">
                  Synchronous video streaming for remote family members and attendees.
                </CardDescription>
              </div>
            </div>

            {/* Organizer Controls */}
            {isOrganizerOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputUrl(streamConfig?.url || "");
                  setStreamTitle(streamConfig?.title || `${event.title} - Live Stream`);
                  setIsEnabled(streamConfig?.isEnabled ?? true);
                  setParseResult(parseYouTubeUrl(streamConfig?.url || ""));
                  setIsEditDialogOpen(true);
                }}
                className="gap-1.5 text-xs h-8 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 self-start sm:self-auto"
              >
                {hasStream ? (
                  <>
                    <Edit2 className="h-3 w-3" />
                    Edit Stream URL
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Set Up Live Stream
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {hasStream ? (
            /* Responsive 16:9 Video Embed */
            <div className="space-y-3">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-zinc-800">
                <iframe
                  src={streamConfig.embedUrl}
                  title={streamConfig.title || event.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Stream Details & Actions Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {streamConfig.title || `${event.title} Live Broadcast`}
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    Powered by YouTube Live • High Definition 1080p Stream
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyStreamLink}
                    className="h-8 text-[11px] gap-1.5 text-zinc-600 dark:text-zinc-300"
                  >
                    {isCopiedLink ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        Copied Link!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  {streamConfig.url && (
                    <a
                      href={streamConfig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="h-8 text-[11px] gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open on YouTube
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Clear Fallback Notice when no stream is configured */
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                <Tv className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isOrganizerOrAdmin
                    ? "No Live Stream Configured Yet"
                    : "Live Broadcast Not Scheduled"}
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  {isOrganizerOrAdmin
                    ? "Connect a YouTube Live, Premiere, or unlisted recording link so remote attendees can join the celebration in real-time."
                    : "The hosts have not attached a video stream for this event yet. Check back during the scheduled event time for updates."}
                </p>
              </div>

              {isOrganizerOrAdmin && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setInputUrl("");
                      setStreamTitle(`${event.title} - Live Stream`);
                      setIsEnabled(true);
                      setParseResult({ isValid: false, originalUrl: "" });
                      setIsEditDialogOpen(true);
                    }}
                    className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add YouTube Live URL
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organizer Stream Config Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Radio className="h-5 w-5 text-rose-600" />
              Configure Event Live Stream
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Provide a YouTube Live, Premiere, or video link. Invita will automatically convert it into a responsive 16:9 player for attendees.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateStreamMutation.mutate();
            }}
            className="space-y-4 py-2 text-xs"
          >
            {/* Stream Title */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-800 dark:text-zinc-200">Broadcast Title</label>
              <Input
                placeholder="e.g. Centennial Gala Live Symphony & Keynote"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* YouTube URL input */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-800 dark:text-zinc-200">YouTube Stream URL</label>
              <Input
                placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="h-9 text-xs rounded-xl font-mono"
              />
              <span className="text-[10px] text-zinc-400 block">
                Accepts standard watch links, youtu.be shortlinks, or live channel broadcasts.
              </span>
            </div>

            {/* Validation Feedback & Preview */}
            {inputUrl.trim().length > 0 && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  parseResult.isValid
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                }`}
              >
                {parseResult.isValid ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Valid YouTube Video Identified</span>
                      <span className="text-[11px] font-mono opacity-90 block">
                        Video ID: {parseResult.videoId}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Invalid YouTube URL Format</span>
                      <span className="text-[11px] opacity-90 block">
                        {parseResult.error}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Toggle Active Status */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 block">Enable Broadcast</span>
                <span className="text-[11px] text-zinc-500">
                  When enabled, invited members will see the live 16:9 player on this page.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            {updateStreamMutation.isError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Failed to save stream settings. Please check the URL format.</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-xs text-zinc-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!parseResult.isValid || updateStreamMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4"
              >
                {updateStreamMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save & Publish Stream"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
