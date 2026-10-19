"use client";

import React from "react";
import { PageHeader, EmptyState } from "@/components/shared";
import { MailOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations Hub"
        description="Dispatch personalized digital invitations, manage QR passcodes, and monitor opening analytics."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Invitations" },
        ]}
        actions={
          <Button size="sm" className="gap-1.5">
            <Send className="h-4 w-4" />
            Send Invitations
          </Button>
        }
      />

      <EmptyState
        icon={MailOpen}
        title="Digital Invitations Hub"
        description="Feature page reserved for upcoming sprint. Custom foil designs, digital envelopes, and batch emailing will be here."
        action={{
          label: "Return to Dashboard",
          href: "/",
        }}
      />
    </div>
  );
}
