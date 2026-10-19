export interface AttendeeExportItem {
  name: string;
  affiliation: string;
  type: string;
  status: string;
  attendingCount: number;
  allowedGuests: number;
  mealPreference: string;
  dietaryNotes: string;
  personalNote: string;
  responseDate: string;
  email: string;
  phone: string;
  inviteCode: string;
}

export interface EventExportSummary {
  eventTitle: string;
  eventDate: string;
  venue: string;
  totalInvited: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  totalHeadcount: number;
  mealBreakdown: Record<string, number>;
}
