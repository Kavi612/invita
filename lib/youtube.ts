/**
 * YouTube Live & Video Stream URL Utility
 * Parses, validates, and converts YouTube watch / live / youtu.be / embed URLs
 */

export interface YouTubeParseResult {
  isValid: boolean;
  videoId?: string;
  embedUrl?: string;
  originalUrl: string;
  error?: string;
}

export function parseYouTubeUrl(url: string): YouTubeParseResult {
  if (!url || typeof url !== "string") {
    return {
      isValid: false,
      originalUrl: "",
      error: "Please enter a valid YouTube URL",
    };
  }

  const trimmed = url.trim();

  // Supported formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - VIDEO_ID (11 chars)
  const regex =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|v\/|.+\/)|youtu\.be\/)([^"&?\/\s]{11})/;

  const match = trimmed.match(regex);

  if (match && match[1]) {
    const videoId = match[1];
    return {
      isValid: true,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`,
      originalUrl: trimmed,
    };
  }

  // Check if just the 11-char video ID was pasted directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      isValid: true,
      videoId: trimmed,
      embedUrl: `https://www.youtube.com/embed/${trimmed}?autoplay=1&modestbranding=1&rel=0`,
      originalUrl: `https://www.youtube.com/watch?v=${trimmed}`,
    };
  }

  return {
    isValid: false,
    originalUrl: trimmed,
    error: "Invalid YouTube URL format. Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/live/...",
  };
}

/**
 * Calculates current stream badge status based on event schedule
 */
export function getStreamStatus(startDateStr: string, endDateStr: string): {
  status: "upcoming" | "live" | "ended";
  label: string;
  badgeStyle: string;
} {
  const now = Date.now();
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();

  if (now < start) {
    return {
      status: "upcoming",
      label: "Upcoming Broadcast",
      badgeStyle: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    };
  } else if (now >= start && now <= end) {
    return {
      status: "live",
      label: "LIVE NOW",
      badgeStyle: "bg-rose-600 text-white animate-pulse border-rose-500",
    };
  } else {
    return {
      status: "ended",
      label: "Broadcast Concluded",
      badgeStyle: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    };
  }
}
