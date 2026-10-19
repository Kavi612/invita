import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AttendeeExportItem, EventExportSummary } from "./types";

export function exportAttendeesToPdf(
  attendees: AttendeeExportItem[],
  summary: EventExportSummary,
  filename?: string
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Header title
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27); // zinc-900
  doc.text(summary.eventTitle, 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122); // zinc-500
  doc.text(`Schedule: ${summary.eventDate}  |  Location: ${summary.venue}`, 14, 21);
  doc.text(`Report Generated: ${new Date().toLocaleString()}  |  Invita Gathering Engine`, 14, 26);

  // Summary Metrics Table
  autoTable(doc, {
    startY: 30,
    theme: "grid",
    head: [["Total Invitations", "Accepted", "Confirmed Headcount", "Pending", "Declined"]],
    body: [
      [
        summary.totalInvited.toString(),
        summary.acceptedCount.toString(),
        summary.totalHeadcount.toString(),
        summary.pendingCount.toString(),
        summary.declinedCount.toString(),
      ],
    ],
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontStyle: "bold",
      fontSize: 9,
      textColor: [24, 24, 27],
      halign: "center",
    },
    margin: { left: 14, right: 14 },
  });

  // Catering Summary Table
  const mealEntries = Object.entries(summary.mealBreakdown);
  let currentY = (doc as any).lastAutoTable.finalY + 7;

  if (mealEntries.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(24, 24, 27);
    doc.text("Catering & Meal Selections Breakdown", 14, currentY);

    autoTable(doc, {
      startY: currentY + 2.5,
      theme: "plain",
      head: [["Entrée / Meal Choice", "Confirmed Portions"]],
      body: mealEntries.map(([meal, count]) => [meal, count.toString()]),
      headStyles: {
        fillColor: [244, 244, 245], // zinc 100
        textColor: [63, 63, 70],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [39, 39, 42],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // Main Attendee Table
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text(`Attendee Roster & RSVP Status (${attendees.length} records)`, 14, currentY);

  const tableBody = attendees.map((item) => [
    item.name,
    item.affiliation,
    item.status.toUpperCase(),
    item.attendingCount.toString(),
    item.mealPreference || "—",
    item.dietaryNotes || "—",
    item.responseDate || "Pending",
    item.inviteCode,
  ]);

  autoTable(doc, {
    startY: currentY + 2.5,
    theme: "striped",
    head: [
      [
        "Invitee Name",
        "Household / Group",
        "Status",
        "Guests",
        "Meal Preference",
        "Dietary Notes",
        "Responded",
        "Passcode",
      ],
    ],
    body: tableBody,
    headStyles: {
      fillColor: [24, 24, 27], // zinc 900
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [24, 24, 27],
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 40 },
      2: { cellWidth: 22 },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 50 },
      5: { cellWidth: 42 },
      6: { cellWidth: 28 },
      7: { cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  });

  const cleanName = (filename || summary.eventTitle || "attendees")
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_");

  doc.save(`${cleanName}_attendees.pdf`);
}
