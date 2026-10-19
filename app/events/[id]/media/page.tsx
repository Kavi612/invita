"use client";

import React, { useState, useEffect, use, Suspense, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/hooks/use-auth";
import { can } from "@/lib/permissions";
import { PageHeader, EmptyState, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Media, Event, Invitation } from "@/types";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Video,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Share2,
  Sparkles,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileUp,
  Plus,
  Users,
  Calendar,
  Eye,
} from "lucide-react";

interface EventMediaPageProps {
  params: Promise<{ id: string }>;
}

function EventMediaContent({ eventId }: { eventId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentRole, currentUser } = useAuthStore();

  const isOrganizerOrAdmin =
    can(currentRole || "guest", "media:delete") ||
    can(currentRole || "guest", "event:edit");

  // Fetch Event
  const {
    data: event,
    isLoading: isEventLoading,
    isError: isEventError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.events.getById(eventId),
  });

  // Fetch Invitations to check invited member access
  const { data: invitations = [] } = useQuery({
    queryKey: ["invitations", eventId],
    queryFn: () => api.invitations.list(eventId),
  });

  // Access check: only invited members, organizers, and admins
  const isInvitedMember =
    isOrganizerOrAdmin ||
    invitations.some(
      (inv) =>
        (currentUser?.id && inv.recipientId === currentUser.id) ||
        (currentUser?.email && inv.recipientEmail === currentUser.email) ||
        (currentUser?.familyId && inv.recipientId === currentUser.familyId) ||
        inv.status === "responded"
    );

  // Fetch Media for this event
  const {
    data: mediaItems = [],
    isLoading: isMediaLoading,
    refetch: refetchMedia,
  } = useQuery({
    queryKey: ["event-media", eventId],
    queryFn: () => api.media.list({ eventId }),
    enabled: isInvitedMember,
  });

  // Filter state
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Upload modal & state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<
    Array<{ file: File; previewUrl: string; title: string; mediaType: "image" | "video" }>
  >([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<Media | null>(null);

  // Filtered media list
  const filteredMedia = mediaItems.filter((item) => {
    if (filterType === "all") return true;
    return item.mediaType === filterType;
  });

  // Lightbox navigation handlers
  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handlePrevLightbox = useCallback(() => {
    if (lightboxIndex === null || filteredMedia.length === 0) return;
    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredMedia.length - 1));
  }, [lightboxIndex, filteredMedia.length]);

  const handleNextLightbox = useCallback(() => {
    if (lightboxIndex === null || filteredMedia.length === 0) return;
    setLightboxIndex((prev) => (prev! < filteredMedia.length - 1 ? prev! + 1 : 0));
  }, [lightboxIndex, filteredMedia.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") handleCloseLightbox();
      if (e.key === "ArrowLeft") handlePrevLightbox();
      if (e.key === "ArrowRight") handleNextLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, handlePrevLightbox, handleNextLightbox]);

  // Touch Swipe gestures for Lightbox on Mobile
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (diff > 50) {
      handlePrevLightbox();
    } else if (diff < -50) {
      handleNextLightbox();
    }
    touchStartXRef.current = null;
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (items: typeof uploadFiles) => {
      setIsUploading(true);
      setUploadProgress(15);

      // Simulate step progress
      await new Promise((r) => setTimeout(r, 300));
      setUploadProgress(45);
      await new Promise((r) => setTimeout(r, 400));
      setUploadProgress(85);

      for (const item of items) {
        await api.media.upload({
          communityId: event?.communityId || "comm-1",
          eventId,
          uploaderId: currentUser?.id || "user-current",
          uploaderName: currentUser?.name || "Community Member",
          title: item.title || item.file.name.replace(/\.[^/.]+$/, ""),
          description: "Uploaded to gathering celebration gallery",
          url: item.previewUrl,
          thumbnailUrl: item.previewUrl,
          mediaType: item.mediaType,
          fileSize: item.file.size,
          mimeType: item.file.type,
          tags: ["gathering", "celebration"],
        });
      }

      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 200));
    },
    onSuccess: () => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadFiles([]);
      setIsUploadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event-media", eventId] });
      toast.success("Media Uploaded", "Your photo/video has been added to the gathering gallery.");
    },
    onError: (err: unknown) => {
      setIsUploading(false);
      const errMsg = err instanceof Error ? err.message : "Failed to upload files";
      setUploadError(errMsg);
      toast.error("Upload Failed", errMsg);
    },
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => api.media.delete(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-media", eventId] });
      toast.success("Media Deleted", "The item was removed from the gallery.");
      setItemToDelete(null);
      if (lightboxIndex !== null) {
        setLightboxIndex(null);
      }
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Could not delete media item.";
      toast.error("Delete Failed", errMsg);
    },
  });

  // File selection & drag-and-drop validation
  const handleProcessFiles = (files: FileList | File[]) => {
    setUploadError(null);
    const newItems: typeof uploadFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate Type
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");

      if (!isImg && !isVid) {
        setUploadError(`"${file.name}" has an unsupported format. Please upload JPG, PNG, WEBP, or MP4.`);
        continue;
      }

      // Validate Size (Images max 10MB, Videos max 50MB)
      const maxSize = isImg ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(
          `"${file.name}" exceeds the maximum allowed size of ${isImg ? "10MB" : "50MB"}.`
        );
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        file,
        previewUrl,
        title: file.name.replace(/\.[^/.]+$/, ""),
        mediaType: isVid ? "video" : "image",
      });
    }

    setUploadFiles((prev) => [...prev, ...newItems]);
  };

  // Drag over handlers
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Access Control Guard
  if (!isInvitedMember && !isEventLoading) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Lock}
          title="Celebration Gallery Restricted"
          description="Access to this event's photos and video memories is restricted to invited members and community administrators."
          action={{
            label: "Return to Event Details",
            onClick: () => router.push(`/events/${eventId}`),
          }}
        />
      </div>
    );
  }

  // Loading Skeleton
  if (isEventLoading || isMediaLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isEventError || !event) {
    return (
      <div className="py-16">
        <EmptyState
          icon={AlertCircle}
          title="Event Not Found"
          description="The event you are trying to view gallery assets for does not exist."
          action={{
            label: "Back to Events List",
            onClick: () => router.push("/events"),
          }}
        />
      </div>
    );
  }

  const activeMediaItem = lightboxIndex !== null ? filteredMedia[lightboxIndex] : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Header */}
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Post-Event Media Gallery
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              {mediaItems.length} Memory Assets
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Shared attendee photos, live footage, and celebration archives for {event.title}.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Media Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterType === "all"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              All ({mediaItems.length})
            </button>
            <button
              onClick={() => setFilterType("image")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filterType === "image"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              Photos ({mediaItems.filter((m) => m.mediaType === "image").length})
            </button>
            <button
              onClick={() => setFilterType("video")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filterType === "video"
                  ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Video className="h-3 w-3" />
              Videos ({mediaItems.filter((m) => m.mediaType === "video").length})
            </button>
          </div>

          {/* Upload Button */}
          <Button
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Memories
          </Button>
        </div>
      </div>

      {/* Gallery Grid View */}
      {filteredMedia.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <ImageIcon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No celebration media shared yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Be the first attendee or organizer to contribute event photos, toasts, and recap videos to this gathering.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <FileUp className="h-3.5 w-3.5" />
            Upload First Memory
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item, index) => {
            const isVideo = item.mediaType === "video";
            const canDelete =
              isOrganizerOrAdmin || (currentUser?.id && item.uploaderId === currentUser.id);

            const uploadDateStr = new Date(item.uploadedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Media Preview Container */}
                <div
                  onClick={() => handleOpenLightbox(index)}
                  className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-zinc-950"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title || "Celebration asset"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Overlay Gradient on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      View Fullscreen
                    </span>
                  </div>

                  {/* Video Play Badge */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-zinc-950/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Media Type Pill */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {isVideo ? "Video" : "Photo"}
                    </span>
                  </div>

                  {/* Delete Button (Allowed for Organizer/Admin or Uploader) */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete this media"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.title || "Celebration Snapshot"}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="truncate max-w-[120px] font-medium text-zinc-700 dark:text-zinc-300">
                      {item.uploaderName || "Community Guest"}
                    </span>
                    <span>{uploadDateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal with Next/Previous & Touch Swipe */}
      {activeMediaItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={handleCloseLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Lightbox Topbar */}
          <div
            className="flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-400">
                {lightboxIndex! + 1} / {filteredMedia.length}
              </span>
              <h3 className="text-sm font-bold truncate max-w-sm">
                {activeMediaItem.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activeMediaItem.url}
                target="_blank"
                download
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download full asset"
              >
                <Download className="h-4 w-4" />
              </a>

              {/* Delete inside lightbox if permitted */}
              {(isOrganizerOrAdmin ||
                (currentUser?.id && activeMediaItem.uploaderId === currentUser.id)) && (
                <button
                  onClick={() => setItemToDelete(activeMediaItem)}
                  className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white transition-colors"
                  title="Delete media"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={handleCloseLightbox}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close Lightbox (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Media Display Area */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMediaItem.mediaType === "video" ? (
              <video
                src={activeMediaItem.url}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            ) : (
              <img
                src={activeMediaItem.url}
                alt={activeMediaItem.title || "Lightbox view"}
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain select-none"
              />
            )}

            {/* Left Chevron */}
            <button
              onClick={handlePrevLightbox}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Right Chevron */}
            <button
              onClick={handleNextLightbox}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Caption & Uploader Footer */}
          <div
            className="text-center text-xs text-zinc-300 space-y-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-white">
              {activeMediaItem.description || activeMediaItem.title}
            </p>
            <p className="text-[11px] text-zinc-400">
              Contributed by <span className="font-bold text-zinc-200">{activeMediaItem.uploaderName}</span> on{" "}
              {new Date(activeMediaItem.uploadedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Upload Memories Modal Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-600" />
              Upload Celebration Memories
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Share high-resolution snapshots or recap clips from {event.title}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01]"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-indigo-500"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={(e) => {
                  if (e.target.files) handleProcessFiles(e.target.files);
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-2">
                <FileUp className="h-6 w-6" />
              </div>

              <div className="font-bold text-zinc-800 dark:text-zinc-200">
                Drag & Drop Photos or Videos here, or{" "}
                <span className="text-indigo-600 dark:text-indigo-400 underline">Browse Files</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Supports JPG, PNG, WEBP (up to 10MB) and MP4, MOV (up to 50MB)
              </p>
            </div>

            {/* Error Notice */}
            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Queue Previews */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                  Queued for Upload ({uploadFiles.length} items)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uploadFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2 relative"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                        {item.mediaType === "video" ? (
                          <div className="w-full h-full flex items-center justify-center text-white bg-zinc-800">
                            <Video className="h-4 w-4" />
                          </div>
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Input
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...uploadFiles];
                            updated[idx].title = e.target.value;
                            setUploadFiles(updated);
                          }}
                          className="h-7 text-xs bg-white dark:bg-zinc-900 px-2"
                          placeholder="Title/Caption"
                        />
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB • {item.mediaType}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFiles(uploadFiles.filter((_, i) => i !== idx));
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <span>Uploading {uploadFiles.length} assets to album...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="h-full bg-indigo-600 transition-all duration-300"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUploading}
              onClick={() => {
                setUploadFiles([]);
                setIsUploadModalOpen(false);
              }}
              className="text-xs text-zinc-500"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={uploadFiles.length === 0 || isUploading}
              onClick={() => uploadMutation.mutate(uploadFiles)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Uploading...
                </>
              ) : (
                `Upload ${uploadFiles.length} Memory Asset${uploadFiles.length > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        variant="destructive"
        title="Delete Celebration Media?"
        description={`Are you sure you want to remove "${itemToDelete?.title || "this media item"}"? This will permanently remove the asset from the gathering gallery.`}
        confirmLabel="Delete Asset"
        cancelLabel="Keep in Gallery"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteMutation.mutateAsync(itemToDelete.id);
          }
        }}
      />
    </div>
  );
}

export default function EventMediaPage({ params }: EventMediaPageProps) {
  const unwrappedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <EventMediaContent eventId={unwrappedParams.id} />
    </Suspense>
  );
}
