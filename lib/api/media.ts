import { Media, MediaType } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendMediaDto {
  id: string;
  community_id?: string;
  communityId?: string;
  event_id?: string;
  eventId?: string;
  uploader_id?: string;
  uploaderId?: string;
  uploader_name?: string;
  uploaderName?: string;
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  media_type?: string;
  mediaType?: string;
  file_size?: number;
  fileSize?: number;
  mime_type?: string;
  mimeType?: string;
  tags?: string[];
  uploaded_at?: string;
  uploadedAt?: string;
}

export function mapBackendMedia(dto: BackendMediaDto): Media {
  return {
    id: dto.id,
    communityId: dto.community_id || dto.communityId || "",
    eventId: dto.event_id || dto.eventId,
    uploaderId: dto.uploader_id || dto.uploaderId || "",
    uploaderName: dto.uploader_name || dto.uploaderName,
    title: dto.title,
    description: dto.description,
    url: dto.url,
    thumbnailUrl: dto.thumbnail_url || dto.thumbnailUrl,
    mediaType: (dto.media_type || dto.mediaType || "image") as MediaType,
    fileSize: dto.file_size ?? dto.fileSize ?? 0,
    mimeType: dto.mime_type || dto.mimeType || "application/octet-stream",
    tags: dto.tags,
    uploadedAt: dto.uploaded_at || dto.uploadedAt || new Date().toISOString(),
  };
}

export const mediaApi = {
  async list(params?: { eventId?: string; communityId?: string }): Promise<Media[]> {
    if (isMockMode()) {
      await mockStore.delay(200);
      let res = [...mockStore.media];
      if (params?.eventId) {
        res = res.filter((m) => m.eventId === params.eventId);
      } else if (params?.communityId) {
        res = res.filter((m) => m.communityId === params.communityId);
      }
      return res;
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /media. Please provide backend API docs.",
      501
    );
  },

  async upload(data: Omit<Media, "id" | "uploadedAt">): Promise<Media> {
    if (isMockMode()) {
      await mockStore.delay(400);
      const newMedia: Media = {
        ...data,
        id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        uploadedAt: new Date().toISOString(),
      };
      mockStore.media.unshift(newMedia);
      return newMedia;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /media. Please provide backend API docs.",
      501
    );
  },

  async uploadFile(
    file: File,
    meta: {
      eventId?: string;
      communityId: string;
      uploaderId: string;
      uploaderName?: string;
      title?: string;
      description?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<Media> {
    if (isMockMode()) {
      // Simulate stepped progress upload
      if (onProgress) {
        for (let p = 15; p <= 90; p += 25) {
          await mockStore.delay(100);
          onProgress(p);
        }
      }
      await mockStore.delay(200);
      if (onProgress) onProgress(100);

      const objectUrl = URL.createObjectURL(file);
      return mediaApi.upload({
        communityId: meta.communityId,
        eventId: meta.eventId,
        uploaderId: meta.uploaderId,
        uploaderName: meta.uploaderName,
        title: meta.title || file.name,
        description: meta.description,
        url: objectUrl,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
        fileSize: file.size,
        mimeType: file.type,
      });
    }

    // Real API implementation: multipart form upload or presigned url
    const formData = new FormData();
    formData.append("file", file);
    if (meta.eventId) formData.append("eventId", meta.eventId);
    formData.append("communityId", meta.communityId);
    formData.append("uploaderId", meta.uploaderId);
    if (meta.title) formData.append("title", meta.title);

    throw new ApiError(
      "Missing endpoint documentation: POST /media/upload (multipart/form-data or pre-signed URL). Please provide backend API docs.",
      501
    );
  },

  async delete(id: string): Promise<boolean> {
    if (isMockMode()) {
      await mockStore.delay(250);
      mockStore.media = mockStore.media.filter((m) => m.id !== id);
      return true;
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /media/${id}. Please provide backend API docs.`,
      501
    );
  },
};
