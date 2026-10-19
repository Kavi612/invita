"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Can } from "@/lib/permissions";
import { PageHeader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityFormDialog } from "@/components/community/CommunityFormDialog";
import {
  Building2,
  Plus,
  Search,
  Users,
  CalendarDays,
  Lock,
  Globe,
  ArrowRight,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function CommunitiesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "private" | "public">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: communities = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["communities"],
    queryFn: () => api.communities.list(),
  });

  const createMutation = useMutation({
    mutationFn: (newComm: any) =>
      api.communities.create({
        ...newComm,
        adminId: "user-1",
        settings: {
          isPrivate: newComm.isPrivate,
          allowMemberInvites: newComm.allowMemberInvites,
          requireApproval: newComm.requireApproval,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  // Filtered list
  const filteredCommunities = communities.filter((comm) => {
    const matchesSearch =
      comm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrivacy =
      privacyFilter === "all" ||
      (privacyFilter === "private" && comm.settings.isPrivate) ||
      (privacyFilter === "public" && !comm.settings.isPrivate);

    return matchesSearch && matchesPrivacy;
  });

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Communities Directory"
        description="Oversee community collectives, review enrollment policies, and explore affiliated family households."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Communities" },
        ]}
        actions={
          <Can action="community:create">
            <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Community
            </Button>
          </Can>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search communities by name or focus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-900/60"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
          <div className="flex rounded-lg border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setPrivacyFilter("all")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                privacyFilter === "all"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPrivacyFilter("private")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                privacyFilter === "private"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Private
            </button>
            <button
              onClick={() => setPrivacyFilter("public")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                privacyFilter === "public"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Public
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800" />
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-4 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-semibold text-sm">Failed to load communities directory</p>
              <p className="text-xs">{String(error || "Network error occurred")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredCommunities.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No Communities Match Criteria"
          description={
            searchTerm
              ? `No communities found matching "${searchTerm}". Try resetting filters.`
              : "No communities have been provisioned in this network yet."
          }
          action={
            searchTerm
              ? {
                  label: "Clear Search Filters",
                  onClick: () => {
                    setSearchTerm("");
                    setPrivacyFilter("all");
                  },
                }
              : undefined
          }
        />
      )}

      {/* Community Grid */}
      {!isLoading && !isError && filteredCommunities.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {filteredCommunities.map((comm) => (
            <Card
              key={comm.id}
              className="overflow-hidden hover:shadow-lg transition-all border-zinc-200/80 dark:border-zinc-800 group"
            >
              {/* Banner Image */}
              <div className="relative h-36 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {comm.bannerUrl ? (
                  <img
                    src={comm.bannerUrl}
                    alt={comm.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-violet-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Privacy Badge */}
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md">
                  {comm.settings.isPrivate ? (
                    <>
                      <Lock className="h-3 w-3 text-amber-400" /> Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 text-emerald-400" /> Public
                    </>
                  )}
                </span>
              </div>

              {/* Card Body */}
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {comm.name}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400">/{comm.slug}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {comm.description || "Active community collective."}
                </p>

                {/* Metrics Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-4 text-zinc-500">
                    <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      {comm.memberCount} Members
                    </span>
                    <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                      <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                      {comm.eventCount} Events
                    </span>
                  </div>

                  <Button size="sm" variant="subtle" asChild className="gap-1 text-xs">
                    <Link href={`/communities/${comm.id}`}>
                      Open Portal <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Provision Community Dialog */}
      <CommunityFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
