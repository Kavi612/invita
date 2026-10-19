"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/use-auth";
import { Can } from "@/lib/permissions";
import { PageHeader, EmptyState, StatusBadge, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FamilyFormDialog } from "@/components/community/FamilyFormDialog";
import { MemberFormDialog } from "@/components/community/MemberFormDialog";
import { Family, Member } from "@/types";
import {
  Home,
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  Network,
} from "lucide-react";

export default function FamiliesPage() {
  const queryClient = useQueryClient();
  const { activeCommunityId } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [selectedFamilyForEdit, setSelectedFamilyForEdit] = useState<Family | null>(null);

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<Member | null>(null);
  const [targetFamilyForMember, setTargetFamilyForMember] = useState<{ id: string; name: string } | null>(null);

  const [expandedFamilyIds, setExpandedFamilyIds] = useState<string[]>(["fam-1", "fam-2"]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  // Queries
  const { data: families = [], isLoading: isFamLoading, isError, error, refetch } = useQuery({
    queryKey: ["families", activeCommunityId],
    queryFn: () => api.families.list(activeCommunityId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", activeCommunityId],
    queryFn: () => api.members.list({ communityId: activeCommunityId }),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: () => api.communities.list(),
  });

  const activeCommunity = communities.find((c) => c.id === activeCommunityId) || communities[0];

  // Mutations
  const createFamilyMutation = useMutation({
    mutationFn: (data: any) =>
      api.families.create({
        ...data,
        communityId: activeCommunityId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["families", activeCommunityId] }),
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.families.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["families", activeCommunityId] }),
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: (id: string) => api.families.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families", activeCommunityId] });
      queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: (data: any) =>
      api.members.create({
        ...data,
        communityId: activeCommunityId,
        role: "member",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] });
      queryClient.invalidateQueries({ queryKey: ["families", activeCommunityId] });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.members.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] }),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => api.members.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] });
      queryClient.invalidateQueries({ queryKey: ["families", activeCommunityId] });
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedFamilyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFamilies = families.filter((fam) => {
    const matchesSearch =
      fam.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fam.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fam.city || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = !cityFilter || fam.city?.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const uniqueCities = Array.from(new Set(families.map((f) => f.city).filter(Boolean)));

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Family Registry"
        description={`Manage household units, designate Heads of Family, and coordinate group RSVPs for ${activeCommunity?.name || "the community"}.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Family Registry" },
        ]}
        actions={
          <Can action="family:create">
            <Button
              onClick={() => {
                setSelectedFamilyForEdit(null);
                setIsFamilyDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Register Family
            </Button>
          </Can>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search families by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-900/60"
          />
        </div>

        <div className="flex items-center gap-2">
          {uniqueCities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All Regions / Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city!}>
                  {city}
                </option>
              ))}
            </select>
          )}

          {activeCommunity && (
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
              <Link href={`/communities/${activeCommunity.id}`}>
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                Community Portal
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isFamLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-900 rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-semibold text-sm">Failed to load family registry</p>
              <p className="text-xs">{String(error || "Network error occurred")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isFamLoading && !isError && filteredFamilies.length === 0 && (
        <EmptyState
          icon={Home}
          title="No Family Units Match Filters"
          description={
            searchTerm || cityFilter
              ? "No registered households match your search query."
              : "No families registered in this community yet."
          }
          action={{
            label: searchTerm || cityFilter ? "Clear Search" : "Register First Family",
            onClick: () => {
              if (searchTerm || cityFilter) {
                setSearchTerm("");
                setCityFilter("");
              } else {
                setSelectedFamilyForEdit(null);
                setIsFamilyDialogOpen(true);
              }
            },
          }}
        />
      )}

      {/* Family Cards */}
      {!isFamLoading && !isError && filteredFamilies.length > 0 && (
        <div className="space-y-4">
          {filteredFamilies.map((family) => {
            const familyMembers = members.filter((m) => m.familyId === family.id);
            const headMember = members.find((m) => m.id === family.headOfFamilyId || m.userId === family.headOfFamilyId);
            const isExpanded = expandedFamilyIds.includes(family.id);

            return (
              <Card
                key={family.id}
                className="border-zinc-200/90 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                          {family.familyName}
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {familyMembers.length} Members
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>
                          Head of Family:{" "}
                          <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            {headMember?.fullName || "Assigned Representative"}
                          </strong>
                        </span>
                        {family.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-zinc-400" />
                            {family.address ? `${family.address}, ` : ""}{family.city}, {family.state}
                          </span>
                        )}
                        {family.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-zinc-400" />
                            {family.phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    <Link href={`/families/${family.id}/tree`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                      >
                        <Network className="h-3.5 w-3.5" />
                        Family Tree
                      </Button>
                    </Link>

                    <Can action="family:manage">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFamilyForEdit(family);
                          setIsFamilyDialogOpen(true);
                        }}
                        className="h-8 text-xs gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Family
                      </Button>
                    </Can>

                    <Can action="family:manage">
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => {
                          setTargetFamilyForMember({ id: family.id, name: family.familyName });
                          setSelectedMemberForEdit(null);
                          setIsMemberDialogOpen(true);
                        }}
                        className="h-8 text-xs gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Member
                      </Button>
                    </Can>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(family.id)}
                      className="h-8 text-xs gap-1"
                    >
                      {isExpanded ? (
                        <>
                          Hide ({familyMembers.length}) <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Members ({familyMembers.length}) <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Household Members */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Registered Household Members ({familyMembers.length})
                      </h4>
                    </div>

                    {familyMembers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500 border border-dashed rounded-xl bg-white dark:bg-zinc-900">
                        No members currently assigned to this family.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                        {familyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                                <AvatarFallback>{member.fullName[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    {member.fullName}
                                  </span>
                                  <span className="text-[10px] capitalize font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                    {member.relationshipToHead || "Member"}
                                  </span>
                                </div>
                                <span className="text-[11px] text-zinc-500 block">
                                  {member.email || member.phone || "No direct phone/email"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <StatusBadge status={member.status} />
                              <Can action="family:manage">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setTargetFamilyForMember({ id: family.id, name: family.familyName });
                                    setSelectedMemberForEdit(member);
                                    setIsMemberDialogOpen(true);
                                  }}
                                  className="h-7 w-7 text-zinc-400 hover:text-zinc-800"
                                  title="Edit Member"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </Can>
                              <Can action="member:delete">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      title: `Remove ${member.fullName}?`,
                                      description: `Are you sure you want to remove ${member.fullName} from ${family.familyName}?`,
                                      onConfirm: async () => {
                                        await deleteMemberMutation.mutateAsync(member.id);
                                      },
                                    });
                                  }}
                                  className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                                  title="Remove Member"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </Can>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Family Dialog */}
      <FamilyFormDialog
        open={isFamilyDialogOpen}
        onOpenChange={setIsFamilyDialogOpen}
        family={selectedFamilyForEdit}
        communityId={activeCommunityId}
        availableMembers={members}
        onSubmit={async (data) => {
          if (selectedFamilyForEdit) {
            await updateFamilyMutation.mutateAsync({ id: selectedFamilyForEdit.id, data });
          } else {
            await createFamilyMutation.mutateAsync(data);
          }
        }}
      />

      {/* Add/Edit Member Dialog */}
      {targetFamilyForMember && (
        <MemberFormDialog
          open={isMemberDialogOpen}
          onOpenChange={setIsMemberDialogOpen}
          member={selectedMemberForEdit}
          familyId={targetFamilyForMember.id}
          familyName={targetFamilyForMember.name}
          communityId={activeCommunityId}
          onSubmit={async (data) => {
            if (selectedMemberForEdit) {
              await updateMemberMutation.mutateAsync({ id: selectedMemberForEdit.id, data });
            } else {
              await createMemberMutation.mutateAsync({
                ...data,
                familyId: targetFamilyForMember.id,
              });
            }
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        confirmLabel="Remove Member"
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
