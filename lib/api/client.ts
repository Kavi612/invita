"use client";

import { useAuthStore } from "@/hooks/use-auth";
import { toast } from "@/components/ui/toast";

export interface ApiErrorResponse {
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}

export class ApiError extends Error implements ApiErrorResponse {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number = 500,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  skipAuth?: boolean;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "https://api.invita.app/v1";

export function isMockMode(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCKS !== undefined) {
    return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  }
  return true;
}

export function isPublicRsvpEndpoint(endpoint: string): boolean {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return normalized.startsWith("/rsvp/") || normalized === "/rsvp";
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, skipAuth, headers: customHeaders, ...customOptions } = options;

  // Build query string
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers = new Headers(customHeaders);

  // Authentication JWT attachment
  const isPublicRsvp = isPublicRsvpEndpoint(endpoint);
  if (!skipAuth && !isPublicRsvp) {
    const storeToken = useAuthStore.getState().token;
    const token =
      storeToken ||
      (typeof window !== "undefined" ? localStorage.getItem("invita_token") : null);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Handle body formatting
  let requestBody: BodyInit | undefined = undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      requestBody = body;
      // Note: do not set Content-Type header so browser populates boundary
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestBody = JSON.stringify(body);
    }
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customOptions,
      headers,
      body: requestBody,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Network error. Please check your connection.";
    throw new ApiError(errorMsg, 0);
  }

  // Intercept 401 Unauthorized
  if (response.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && !currentPath.startsWith("/rsvp")) {
        // Hard navigation clears client state and unloads memory on 401
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    throw new ApiError("Session expired or invalid credentials. Please log in again.", 401);
  }

  // Intercept 403 Forbidden
  if (response.status === 403) {
    const errorMsg = "You do not have permission to perform this action.";
    toast.error("Permission Denied", errorMsg);
    throw new ApiError(errorMsg, 403);
  }

  // Check generic errors
  if (!response.ok) {
    let errorPayload: {
      message?: string;
      error?: string;
      errors?: Record<string, string[]>;
      fieldErrors?: Record<string, string[]>;
    } | null = null;

    try {
      errorPayload = (await response.json()) as {
        message?: string;
        error?: string;
        errors?: Record<string, string[]>;
        fieldErrors?: Record<string, string[]>;
      };
    } catch {
      // response was not JSON
    }

    const message =
      errorPayload?.message ||
      errorPayload?.error ||
      `Request failed with status ${response.status}: ${response.statusText}`;

    const fieldErrors = errorPayload?.fieldErrors || errorPayload?.errors || undefined;

    throw new ApiError(message, response.status, fieldErrors);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export const apiClient = {
  request,
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
  upload: async <T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions & { onProgress?: (pct: number) => void }
  ): Promise<T> => {
    // Standard fetch doesn't natively support upload progress; we emulate progress if callback given,
    // or use XMLHttpRequest when running in browser with progress tracking
    if (typeof window !== "undefined" && window.XMLHttpRequest && options?.onProgress) {
      return new Promise<T>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = endpoint.startsWith("http")
          ? endpoint
          : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

        xhr.open("POST", url);

        const storeToken = useAuthStore.getState().token;
        if (storeToken && !options?.skipAuth) {
          xhr.setRequestHeader("Authorization", `Bearer ${storeToken}`);
        }

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && options.onProgress) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            options.onProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve(xhr.responseText as unknown as T);
            }
          } else if (xhr.status === 401) {
            useAuthStore.getState().logout();
            reject(new ApiError("Unauthorized", 401));
          } else if (xhr.status === 403) {
            toast.error("Permission Denied", "You do not have permission to upload files.");
            reject(new ApiError("Forbidden", 403));
          } else {
            reject(new ApiError(xhr.statusText || "Upload failed", xhr.status));
          }
        };

        xhr.onerror = () => reject(new ApiError("Network error during file upload", 0));
        xhr.send(formData);
      });
    }

    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  },
};
