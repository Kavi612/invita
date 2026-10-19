import { describe, it, expect } from "vitest";
import {
  loginSchema,
  eventFormSchema,
  rsvpSubmissionSchema,
  invitationCreateSchema,
} from "@/lib/validations";

describe("Zod Validation Schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password >= 6 characters", () => {
      const result = loginSchema.safeParse({
        email: "marcus.v@heritagehills.org",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email");
      }
    });

    it("rejects passwords under 6 characters", () => {
      const result = loginSchema.safeParse({
        email: "user@invita.org",
        password: "123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 6 characters");
      }
    });

    it("rejects empty fields", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("eventFormSchema", () => {
    const validEvent = {
      title: "Heritage Gala Banquet",
      type: "cultural" as const,
      description: "An annual gathering to celebrate heritage, history, and community milestones.",
      startDate: "2026-11-20T18:00:00.000Z",
      endDate: "2026-11-20T23:00:00.000Z",
      venueName: "Grand Heritage Ballroom",
      venueAddress: "100 Estate Parkway",
      visibility: "community" as const,
      status: "published" as const,
      maxAttendees: 150,
    };

    it("accepts a fully compliant event payload", () => {
      const result = eventFormSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 3 characters", () => {
      const result = eventFormSchema.safeParse({
        ...validEvent,
        title: "Hi",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3 characters");
      }
    });

    it("rejects description shorter than 10 characters", () => {
      const result = eventFormSchema.safeParse({
        ...validEvent,
        description: "Short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 10 characters");
      }
    });

    it("rejects invalid event type", () => {
      const result = eventFormSchema.safeParse({
        ...validEvent,
        type: "unknown_event_type",
      });
      expect(result.success).toBe(false);
    });

    it("supports virtual events with platform and meeting link", () => {
      const result = eventFormSchema.safeParse({
        ...validEvent,
        isVirtual: true,
        meetingUrl: "https://zoom.us/j/123456789",
        meetingPlatform: "Zoom",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("rsvpSubmissionSchema", () => {
    it("accepts attending response with guestCount >= 1 and preferences", () => {
      const result = rsvpSubmissionSchema.safeParse({
        status: "attending",
        guestCount: 2,
        mealPreference: "Chef's Artisanal Tasting",
        dietaryRequirements: "Nut allergy",
        notes: "Excited to attend!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects attending response with guestCount = 0", () => {
      const result = rsvpSubmissionSchema.safeParse({
        status: "attending",
        guestCount: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least 1 guest must attend");
      }
    });

    it("accepts declined response with guestCount = 0", () => {
      const result = rsvpSubmissionSchema.safeParse({
        status: "declined",
        guestCount: 0,
        notes: "Sending our warm regrets.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative guest count", () => {
      const result = rsvpSubmissionSchema.safeParse({
        status: "declined",
        guestCount: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("invitationCreateSchema", () => {
    it("accepts valid individual recipient with allowed guests", () => {
      const result = invitationCreateSchema.safeParse({
        recipientName: "Eleanor Vance",
        recipientType: "individual",
        allowedGuestsCount: 2,
        recipientEmail: "eleanor@heritagehills.org",
      });
      expect(result.success).toBe(true);
    });

    it("rejects recipient name under 2 characters", () => {
      const result = invitationCreateSchema.safeParse({
        recipientName: "A",
        recipientType: "individual",
        allowedGuestsCount: 1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects allowed guests count < 1", () => {
      const result = invitationCreateSchema.safeParse({
        recipientName: "Family Household",
        recipientType: "family",
        allowedGuestsCount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid recipient email if provided", () => {
      const result = invitationCreateSchema.safeParse({
        recipientName: "John Doe",
        recipientType: "outside_guest",
        allowedGuestsCount: 1,
        recipientEmail: "invalid-email-format",
      });
      expect(result.success).toBe(false);
    });
  });
});
