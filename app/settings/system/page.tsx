"use client";

import React from "react";
import { PageHeader, EmptyState } from "@/components/shared";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Governance & Auditing"
        description="Global system administration, role hierarchies, audit trails, and multi-tenant isolation."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
          { label: "Platform Governance" },
        ]}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Audit System Logs
          </Button>
        }
      />

      <EmptyState
        icon={ShieldAlert}
        title="Platform Governance"
        description="This section is restricted to Super Admins only. Security policies, tenant management, and platform analytics will be administered here."
        action={{
          label: "Return to Dashboard",
          href: "/",
        }}
      />
    </div>
  );
}
