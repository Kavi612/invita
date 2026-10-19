import { ReminderSetting, ReminderType } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendReminderSettingDto {
  id: string;
  event_id?: string;
  eventId?: string;
  type: string;
  title: string;
  timing: string;
  enabled: boolean;
  channel: "email" | "whatsapp" | "both";
  description?: string;
}

export function mapBackendReminderSetting(
  dto: BackendReminderSettingDto
): ReminderSetting {
  return {
    id: dto.id,
    eventId: dto.event_id || dto.eventId || "",
    type: (dto.type as ReminderType) || "before_event",
    title: dto.title,
    timing: dto.timing,
    enabled: dto.enabled,
    channel: dto.channel || "both",
    description: dto.description,
  };
}

export const remindersApi = {
  async getSettings(eventId: string): Promise<ReminderSetting[]> {
    if (isMockMode()) {
      await mockStore.delay(150);
      const list = mockStore.reminderSettings.filter((r) => r.eventId === eventId);
      if (list.length > 0) return [...list];

      // Fallback defaults for any event
      const defaults: ReminderSetting[] = [
        {
          id: `rem-rsvp-${eventId}`,
          eventId,
          type: "after_rsvp",
          title: "Instant RSVP Confirmation",
          timing: "immediately",
          enabled: true,
          channel: "both",
          description:
            "Sends an immediate booking confirmation with personal passcode and calendar invite.",
        },
        {
          id: `rem-24h-${eventId}`,
          eventId,
          type: "before_event",
          title: "Pre-Event Countdown Reminder",
          timing: "24 hours before",
          enabled: true,
          channel: "whatsapp",
          description:
            "Sends directions, dress code, and check-in QR pass ahead of arrival.",
        },
        {
          id: `rem-1h-${eventId}`,
          eventId,
          type: "before_event",
          title: "Final Hour Day-Of Reminder",
          timing: "1 hour before",
          enabled: false,
          channel: "whatsapp",
          description: "Sends parking navigation and seating hall entry notice.",
        },
        {
          id: `rem-chg-${eventId}`,
          eventId,
          type: "on_change",
          title: "Schedule or Venue Update Alert",
          timing: "immediately",
          enabled: true,
          channel: "both",
          description:
            "Automatically notifies confirmed and tentative guests if event time or location changes.",
        },
      ];
      mockStore.reminderSettings.push(...defaults);
      return defaults;
    }

    throw new ApiError(
      `Missing endpoint documentation: GET /events/${eventId}/reminders. Please provide backend API docs.`,
      501
    );
  },

  async updateSetting(
    eventId: string,
    id: string,
    updates: Partial<ReminderSetting>
  ): Promise<ReminderSetting> {
    if (isMockMode()) {
      await mockStore.delay(150);
      const idx = mockStore.reminderSettings.findIndex((r) => r.id === id);
      if (idx !== -1) {
        mockStore.reminderSettings[idx] = {
          ...mockStore.reminderSettings[idx],
          ...updates,
        };
        return { ...mockStore.reminderSettings[idx] };
      } else {
        const newRem: ReminderSetting = {
          id,
          eventId,
          type: updates.type || "before_event",
          title: updates.title || "Reminder",
          timing: updates.timing || "24 hours before",
          enabled: updates.enabled ?? true,
          channel: updates.channel || "both",
          description: updates.description,
          ...updates,
        };
        mockStore.reminderSettings.push(newRem);
        return newRem;
      }
    }

    throw new ApiError(
      `Missing endpoint documentation: PATCH /events/${eventId}/reminders/${id}. Please provide backend API docs.`,
      501
    );
  },
};
