"use client";

import React from "react";
import { PageHeader, EmptyState } from "@/components/shared";
import { UserCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RsvpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="RSVP Management"
        description="Monitor real-time headcounts, dietary requirements, and guest attendance statuses."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "RSVP Management" },
        ]}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export Guestlist
          </Button>
        }
      />

      <EmptyState
        icon={UserCheck}
        title="RSVP Analytics & Logistics"
        description="Feature page reserved for upcoming sprint. Headcount summaries, seating allocations, and meal reports will be here."
        action={{
          label: "Return to Dashboard",
          href: "/",
        }}
      />
    </div>
  );
}
