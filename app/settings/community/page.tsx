"use client";

import React from "react";
import { PageHeader, EmptyState } from "@/components/shared";
import { SlidersHorizontal, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CommunitySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Community Settings"
        description="Configure community brand identities, privacy flags, and approval workflows."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
          { label: "Community" },
        ]}
        actions={
          <Button size="sm" className="gap-1.5">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      <EmptyState
        icon={SlidersHorizontal}
        title="Community Configuration"
        description="Feature page reserved for upcoming sprint. Community administrators can adjust branding, member approval policies, and communication preferences here."
        action={{
          label: "Return to Dashboard",
          href: "/",
        }}
      />
    </div>
  );
}
