import * as z from "zod";
export { zodResolver } from "./resolver";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum([
    "wedding",
    "anniversary",
    "birthday",
    "reunion",
    "cultural",
    "religious",
    "conference",
    "social",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().min(1, "Start date and time is required"),
  endDate: z.string().min(1, "End date and time is required"),
  rsvpDeadline: z.string().optional(),
  isVirtual: z.boolean().default(false),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  venueCity: z.string().optional(),
  venueMapUrl: z.string().optional(),
  meetingUrl: z.string().optional(),
  meetingPlatform: z.string().optional(),
  visibility: z.enum(["public", "community", "sub_community", "private"]).default("community"),
  status: z.enum(["draft", "published", "ongoing", "completed", "cancelled"]).default("published"),
  coverImage: z.string().optional(),
  maxAttendees: z.coerce.number().optional(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const rsvpSubmissionSchema = z.object({
  status: z.enum(["attending", "declined"]),
  guestCount: z.coerce.number().int().min(0, "Guest count cannot be negative"),
  mealPreference: z.string().optional(),
  dietaryRequirements: z.string().max(500, "Dietary requirements too long").optional(),
  notes: z.string().max(1000, "Note too long").optional(),
}).refine(
  (data) => (data.status === "attending" ? data.guestCount >= 1 : true),
  {
    message: "At least 1 guest must attend when accepting invitation",
    path: ["guestCount"],
  }
);

export type RsvpSubmissionValues = z.infer<typeof rsvpSubmissionSchema>;

export const invitationCreateSchema = z.object({
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
  recipientType: z.enum(["individual", "family", "sub_community", "outside_guest"]),
  allowedGuestsCount: z.coerce.number().int().min(1, "Allowed guests must be at least 1"),
  recipientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  recipientPhone: z.string().optional(),
  customMessage: z.string().max(500).optional(),
});

export type InvitationCreateValues = z.infer<typeof invitationCreateSchema>;
