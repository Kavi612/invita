import * as XLSX from "xlsx";
import { AttendeeExportItem, EventExportSummary } from "./types";

export function exportAttendeesToExcel(
  attendees: AttendeeExportItem[],
  summary: EventExportSummary,
  filename?: string
): void {
  // Sheet 1: Attendee Roster
  const attendeeRows = attendees.map((item) => ({
    "Invitee Name": item.name,
    "Household / Group": item.affiliation,
    "Recipient Type": item.type,
    "RSVP Status": item.status,
    "Attending Headcount": item.attendingCount,
    "Allowed Headcount": item.allowedGuests,
    "Meal Preference": item.mealPreference || "—",
    "Dietary Restrictions": item.dietaryNotes || "—",
    "Personal Note": item.personalNote || "—",
    "Responded Date": item.responseDate || "Pending",
    "Contact Email": item.email || "—",
    "Contact Phone": item.phone || "—",
    "Invite Passcode": item.inviteCode,
  }));

  const wsAttendees = XLSX.utils.json_to_sheet(attendeeRows);

  // Column width formatting
  wsAttendees["!cols"] = [
    { wch: 24 }, // Name
    { wch: 22 }, // Affiliation
    { wch: 16 }, // Type
    { wch: 14 }, // Status
    { wch: 18 }, // Attending Headcount
    { wch: 18 }, // Allowed Headcount
    { wch: 30 }, // Meal
    { wch: 24 }, // Dietary
    { wch: 30 }, // Note
    { wch: 16 }, // Responded Date
    { wch: 26 }, // Email
    { wch: 18 }, // Phone
    { wch: 18 }, // Invite Code
  ];

  // Sheet 2: Event Summary & Catering Breakdown
  const summaryRows = [
    ["INVITA GATHERING REPORT — ATTENDEE & LOGISTICS SUMMARY"],
    ["Generated At", new Date().toLocaleString()],
    [],
    ["Event Title", summary.eventTitle],
    ["Event Date", summary.eventDate],
    ["Venue / Platform", summary.venue],
    [],
    ["ATTENDANCE METRICS", "HEADCOUNT / COUNT"],
    ["Total Invitations Issued", summary.totalInvited],
    ["Accepted Invitations", summary.acceptedCount],
    ["Total Confirmed Headcount (Guests)", summary.totalHeadcount],
    ["Pending / Unanswered Invitations", summary.pendingCount],
    ["Declined Invitations", summary.declinedCount],
    [],
    ["CATERING & MEAL SELECTIONS", "COUNT"],
    ...Object.entries(summary.mealBreakdown).map(([meal, count]) => [meal, count]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 25 }];

  // Assemble Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsAttendees, "Attendee Roster");
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary & Catering");

  const cleanName = (filename || summary.eventTitle || "attendees")
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_");

  XLSX.writeFile(wb, `${cleanName}_attendees.xlsx`);
}
