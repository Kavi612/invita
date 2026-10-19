"use client";

import React from "react";
import { PageHeader, EmptyState } from "@/components/shared";
import { Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Gallery"
        description="Share celebration albums, program booklets, seating charts, and photography."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Media Gallery" },
        ]}
        actions={
          <Button size="sm" className="gap-1.5">
            <UploadCloud className="h-4 w-4" />
            Upload Media
          </Button>
        }
      />

      <EmptyState
        icon={ImageIcon}
        title="Community Photo & Media Gallery"
        description="Feature page reserved for upcoming sprint. Cloud upload, high-resolution albums, and event tagging will be here."
        action={{
          label: "Return to Dashboard",
          href: "/",
        }}
      />
    </div>
  );
}
