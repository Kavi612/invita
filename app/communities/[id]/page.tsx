"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Can } from "@/lib/permissions";
import { PageHeader, EmptyState, StatusBadge, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FamilyFormDialog } from "@/components/community/FamilyFormDialog";
import { MemberFormDialog } from "@/components/community/MemberFormDialog";
import { SubCommunityModal } from "@/components/community/SubCommunityModal";
import { Family, Member, SubCommunity } from "@/types";
import {
  Building2,
  Home,
  Users,
  CalendarDays,
  Lock,
  Globe,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserPlus,
  Sparkles,
  HeartHandshake,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Mail,
  Phone,
  Shield,
  Layers,
  Network,
} from "lucide-react";

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>;
}

function CommunityDetailContent({ params }: CommunityDetailPageProps) {
  const { id: communityId } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"families" | "groups" | "directory" | "settings">("families");

  // State for Family Dialog
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [selectedFamilyForEdit, setSelectedFamilyForEdit] = useState<Family | null>(null);

  // State for Member Dialog
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<Member | null>(null);
  const [targetFamilyForMember, setTargetFamilyForMember] = useState<{ id: string; name: string } | null>(null);

  // State for Sub-Community Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<SubCommunity | null>(null);

  // Expanded family accordion cards
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<string[]>([]);

  // Search & Filters for families
  const [familySearch, setFamilySearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Search for groups
  const [groupSearch, setGroupSearch] = useState("");

  // Confirmation modal
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
  const {
    data: community,
    isLoading: isCommLoading,
    isError: isCommError,
  } = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => api.communities.getById(communityId),
  });

  const { data: families = [], isLoading: isFamiliesLoading } = useQuery({
    queryKey: ["families", communityId],
    queryFn: () => api.families.list(communityId),
  });

  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["members", communityId],
    queryFn: () => api.members.list({ communityId }),
  });

  const { data: subCommunities = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ["subCommunities", communityId],
    queryFn: () => api.subCommunities.list(communityId),
  });

  // Mutations
  const createFamilyMutation = useMutation({
    mutationFn: (data: any) =>
      api.families.create({
        ...data,
        communityId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["families", communityId] }),
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.families.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["families", communityId] }),
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: (id: string) => api.families.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families", communityId] });
      queryClient.invalidateQueries({ queryKey: ["members", communityId] });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: (data: any) =>
      api.members.create({
        ...data,
        communityId,
        role: "member",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", communityId] });
      queryClient.invalidateQueries({ queryKey: ["families", communityId] });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.members.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", communityId] }),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => api.members.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", communityId] });
      queryClient.invalidateQueries({ queryKey: ["families", communityId] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: any) =>
      api.subCommunities.create({
        ...data,
        communityId,
        memberIds: [],
        createdBy: "user-2",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subCommunities", communityId] }),
  });

  const addGroupMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      api.subCommunities.addMember(groupId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subCommunities", communityId] }),
  });

  const removeGroupMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      api.subCommunities.removeMember(groupId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subCommunities", communityId] }),
  });

  // Toggle family expansion
  const toggleFamilyExpand = (id: string) => {
    setExpandedFamilyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (isCommLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-xs text-zinc-500">Loading community portal...</span>
      </div>
    );
  }

  if (isCommError || !community) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/communities" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Communities
          </Link>
        </Button>
        <EmptyState
          icon={AlertCircle}
          title="Community Not Found"
          description="The requested community could not be loaded or may have been archived."
          action={{
            label: "Return to Communities",
            href: "/communities",
          }}
        />
      </div>
    );
  }

  // Filtered families
  const filteredFamilies = families.filter((fam) => {
    const matchesSearch =
      fam.familyName.toLowerCase().includes(familySearch.toLowerCase()) ||
      (fam.address || "").toLowerCase().includes(familySearch.toLowerCase()) ||
      (fam.city || "").toLowerCase().includes(familySearch.toLowerCase());

    const matchesCity = !cityFilter || fam.city?.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const uniqueCities = Array.from(new Set(families.map((f) => f.city).filter(Boolean)));

  // Filtered groups
  const filteredGroups = subCommunities.filter((grp) =>
    grp.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    grp.description.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-zinc-500 hover:text-zinc-900">
          <Link href="/communities">
            <ArrowLeft className="h-4 w-4" />
            Back to All Communities
          </Link>
        </Button>
      </div>

      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-zinc-900">
          {community.bannerUrl && (
            <img
              src={community.bannerUrl}
              alt={community.name}
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Privacy Badge */}
          <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10">
            {community.settings.isPrivate ? (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-400" /> Private Collective
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5 text-emerald-400" /> Public Collective
              </>
            )}
          </span>
        </div>

        {/* Hero Content Bar */}
        <div className="px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0 -mt-12 sm:-mt-16 z-10 relative">
              {community.logoUrl ? (
                <img src={community.logoUrl} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  {community.name[0]}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {community.name}
              </h1>
              <p className="text-xs text-zinc-500 max-w-xl line-clamp-1 mt-0.5">
                {community.description}
              </p>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              {members.length} Members
            </span>
            <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-emerald-500" />
              {families.length} Families
            </span>
            <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              {subCommunities.length} Groups
            </span>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800 px-6 sm:px-8 flex gap-6 text-sm font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("families")}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "families"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Home className="h-4 w-4" />
            Families Registry ({families.length})
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "groups"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Sub-Communities & Groups ({subCommunities.length})
          </button>

          <button
            onClick={() => setActiveTab("directory")}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "directory"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Users className="h-4 w-4" />
            Directory ({members.length})
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "settings"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Governance & Rules
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: FAMILIES REGISTRY                                          */}
      {/* ================================================================= */}
      {activeTab === "families" && (
        <div className="space-y-6">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search families by name, address, or city..."
                  value={familySearch}
                  onChange={(e) => setFamilySearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-zinc-900/60"
                />
              </div>

              {uniqueCities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city!}>
                      {city}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Can action="family:create">
              <Button
                onClick={() => {
                  setSelectedFamilyForEdit(null);
                  setIsFamilyDialogOpen(true);
                }}
                className="gap-1.5 text-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                Register Family Unit
              </Button>
            </Can>
          </div>

          {/* Families List & Members Breakdown */}
          {filteredFamilies.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No Families Found"
              description={
                familySearch || cityFilter
                  ? "No family households match your search query. Try clearing filters."
                  : "No family units registered in this community yet."
              }
              action={
                familySearch || cityFilter
                  ? {
                      label: "Reset Search",
                      onClick: () => {
                        setFamilySearch("");
                        setCityFilter("");
                      },
                    }
                  : undefined
              }
            />
          ) : (
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
                    {/* Family Card Header */}
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

                          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>
                              Head: <strong className="text-zinc-800 dark:text-zinc-200">{headMember?.fullName || "Assigned Representative"}</strong>
                            </span>
                            {family.city && <span>• {family.city}, {family.state}</span>}
                            {family.phone && <span>• {family.phone}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Family Action Controls */}
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
                          onClick={() => toggleFamilyExpand(family.id)}
                          className="h-8 text-xs gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Hide Members <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              View Members ({familyMembers.length}) <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Members List */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Household Members ({familyMembers.length})
                          </h4>
                        </div>

                        {familyMembers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-zinc-500 border border-dashed rounded-xl bg-white dark:bg-zinc-900">
                            No members added yet. Use "Add Member" to register household participants.
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {familyMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-xs transition-shadow"
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
                                      {member.email || member.phone || "No direct contact"}
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
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SUB-COMMUNITIES (CUSTOM GROUPS / WHATSAPP CIRCLES)         */}
      {/* ================================================================= */}
      {activeTab === "groups" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search custom groups (e.g. Committees, Circles)..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="pl-9 bg-white dark:bg-zinc-900/60"
              />
            </div>

            <Can action="community:edit">
              <Button
                onClick={() => {
                  setSelectedGroupForEdit(null);
                  setIsGroupModalOpen(true);
                }}
                className="gap-1.5 text-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                Create Custom Group
              </Button>
            </Can>
          </div>

          {filteredGroups.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Sub-Community Groups Yet"
              description="Create targeted member circles (like WhatsApp committees or advisory groups) to coordinate specific celebration efforts."
              action={{
                label: "Create First Group",
                onClick: () => {
                  setSelectedGroupForEdit(null);
                  setIsGroupModalOpen(true);
                },
              }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {filteredGroups.map((group) => {
                const groupMembers = members.filter((m) => group.memberIds?.includes(m.id));

                return (
                  <Card
                    key={group.id}
                    className="border-zinc-200/90 dark:border-zinc-800 hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                              {group.name}
                            </CardTitle>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              {group.isPrivate ? (
                                <>
                                  <Lock className="h-3 w-3 text-amber-500" /> Private Group
                                </>
                              ) : (
                                <>
                                  <Globe className="h-3 w-3 text-emerald-500" /> Open Circle
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <Can action="community:edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedGroupForEdit(group);
                              setIsGroupModalOpen(true);
                            }}
                            className="h-8 text-xs gap-1"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Manage
                          </Button>
                        </Can>
                      </div>
                      <CardDescription className="text-xs pt-1 line-clamp-2">
                        {group.description || "Active community interest group."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs">
                        {/* Member Avatars */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {groupMembers.slice(0, 4).map((m) => (
                              <Avatar key={m.id} className="h-7 w-7 border-2 border-white dark:border-zinc-900">
                                <AvatarImage src={m.avatarUrl} alt={m.fullName} />
                                <AvatarFallback>{m.fullName[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {groupMembers.length} Members
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedGroupForEdit(group);
                            setIsGroupModalOpen(true);
                          }}
                          className="h-7 text-[11px]"
                        >
                          View Circle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: MEMBER DIRECTORY                                           */}
      {/* ================================================================= */}
      {activeTab === "directory" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Community Member Directory</CardTitle>
            <CardDescription>
              All registered individuals with community access or household affiliation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {members.map((m) => {
                const fam = families.find((f) => f.id === m.familyId);
                return (
                  <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatarUrl} alt={m.fullName} />
                        <AvatarFallback>{m.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                          {m.fullName}
                        </span>
                        <span className="text-[11px] text-zinc-500 block">
                          {fam ? `Family: ${fam.familyName}` : "Individual Member"} · {m.email || "No email"}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* TAB 4: GOVERNANCE & SETTINGS                                      */}
      {/* ================================================================= */}
      {activeTab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Community Governance Policies</CardTitle>
            <CardDescription>
              Adjust enrollment rules, privacy parameters, and membership standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Private Membership Network
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Restricts invitations, event schedules, and photo albums to admitted members.
                  </p>
                </div>
                <Can action="community:settings" fallback={<StatusBadge status={community.settings.isPrivate ? "Active" : "Disabled"} />}>
                  <input
                    type="checkbox"
                    checked={community.settings.isPrivate}
                    readOnly
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                </Can>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Household Invitation Privileges
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Permits family heads to extend guest passes to relatives and extended households.
                  </p>
                </div>
                <Can action="community:settings" fallback={<StatusBadge status={community.settings.allowMemberInvites ? "Active" : "Disabled"} />}>
                  <input
                    type="checkbox"
                    checked={community.settings.allowMemberInvites}
                    readOnly
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                </Can>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Add/Edit Family Form */}
      <FamilyFormDialog
        open={isFamilyDialogOpen}
        onOpenChange={setIsFamilyDialogOpen}
        family={selectedFamilyForEdit}
        communityId={communityId}
        availableMembers={members}
        onSubmit={async (data) => {
          if (selectedFamilyForEdit) {
            await updateFamilyMutation.mutateAsync({ id: selectedFamilyForEdit.id, data });
          } else {
            await createFamilyMutation.mutateAsync(data);
          }
        }}
      />

      {/* Dialog: Add/Edit Member Form */}
      {targetFamilyForMember && (
        <MemberFormDialog
          open={isMemberDialogOpen}
          onOpenChange={setIsMemberDialogOpen}
          member={selectedMemberForEdit}
          familyId={targetFamilyForMember.id}
          familyName={targetFamilyForMember.name}
          communityId={communityId}
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

      {/* Modal: Sub-Community Custom Group */}
      <SubCommunityModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        subCommunity={selectedGroupForEdit}
        communityId={communityId}
        allMembers={members}
        onSaveGroup={async (data) => {
          if (selectedGroupForEdit) {
            // Update group
          } else {
            await createGroupMutation.mutateAsync(data);
          }
        }}
        onAddMember={async (groupId, memberId) => {
          await addGroupMemberMutation.mutateAsync({ groupId, memberId });
        }}
        onRemoveMember={async (groupId, memberId) => {
          await removeGroupMemberMutation.mutateAsync({ groupId, memberId });
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        confirmLabel="Remove"
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}

export default function CommunityDetailPage(props: CommunityDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-xs text-zinc-500">Loading community portal...</span>
        </div>
      }
    >
      <CommunityDetailContent {...props} />
    </Suspense>
  );
}
