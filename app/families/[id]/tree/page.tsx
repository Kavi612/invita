"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Member, Family } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Can } from "@/components/shared/Can";
import { Button } from "@/components/ui/button";
import { FamilyTreeCanvas } from "@/components/family/FamilyTreeCanvas";
import { FamilyTreeDrawer } from "@/components/family/FamilyTreeDrawer";
import { MemberFormDialog } from "@/components/community/MemberFormDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Network,
  ArrowLeft,
  UserPlus,
  Users,
  Home,
  Crown,
  ChevronDown,
  Sparkles,
  Layers,
  Phone,
  MapPin,
  Maximize,
  Minimize,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

function FamilyTreeContent({ familyId }: { familyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberForEdit, setMemberForEdit] = useState<Member | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch Family details
  const {
    data: family,
    isLoading: isFamLoading,
    isError: isFamError,
    refetch: refetchFamily,
  } = useQuery({
    queryKey: ["family", familyId],
    queryFn: () => api.families.getById(familyId),
  });

  // Fetch Family Members
  const {
    data: members = [],
    isLoading: isMemLoading,
    isError: isMemError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["members", { familyId }],
    queryFn: () => api.members.list({ familyId }),
  });

  // Fetch all families for quick family switcher dropdown
  const { data: allFamilies = [] } = useQuery({
    queryKey: ["families"],
    queryFn: () => api.families.list(),
  });

  // Mutation to update member details
  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Member> }) =>
      api.members.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["members", { familyId }] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      // Update selected member view if open
      if (selectedMember?.id === updated.id) {
        setSelectedMember(updated);
      }
    },
  });

  // Mutation to create new member directly from tree page
  const createMemberMutation = useMutation({
    mutationFn: (data: any) =>
      api.members.create({
        ...data,
        familyId,
        communityId: family?.communityId || "comm-1",
        role: "member",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", { familyId }] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["family", familyId] });
    },
  });

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  const handleEditMemberFromDrawer = (member: Member) => {
    setMemberForEdit(member);
    setIsMemberDialogOpen(true);
  };

  const handleMemberFormSubmit = async (formData: any) => {
    if (memberForEdit) {
      await updateMemberMutation.mutateAsync({
        id: memberForEdit.id,
        data: formData,
      });
    } else {
      await createMemberMutation.mutateAsync(formData);
    }
    setIsMemberDialogOpen(false);
    setMemberForEdit(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (isFamLoading || isMemLoading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-[680px] bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse flex flex-col items-center justify-center text-zinc-400 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Constructing Genealogical Hierarchy...</p>
        </div>
      </div>
    );
  }

  if (isFamError || !family) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertCircle}
          title="Family Record Not Found"
          description="The requested household does not exist or may have been unlinked from the registry."
          action={{
            label: "Return to Family Registry",
            onClick: () => router.push("/families"),
          }}
        />
      </div>
    );
  }

  const headMember = members.find(
    (m) => m.relationshipToHead === "head" || m.id === family.headOfFamilyId
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Navigation */}
      <PageHeader
        title={`${family.familyName} — Family Tree`}
        description="Interactive genealogical hierarchy mapping lineage, generational tiers, and household relationships."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Family Registry", href: "/families" },
          { label: family.familyName, href: "/families" },
          { label: "Interactive Tree" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Family Switcher */}
            {allFamilies.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                    <Home className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Switch Family</span>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {allFamilies.map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      onClick={() => router.push(`/families/${f.id}/tree`)}
                      className={`flex items-center justify-between text-xs ${
                        f.id === family.id ? "font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40" : ""
                      }`}
                    >
                      <span className="truncate">{f.familyName}</span>
                      <span className="text-[10px] text-zinc-400">
                        {f.memberCount || 0} kin
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Back to Registry */}
            <Link href="/families">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                <ArrowLeft className="h-3.5 w-3.5" />
                Registry
              </Button>
            </Link>

            {/* Add Member button (Permission based) */}
            <Can action="family:manage">
              <Button
                size="sm"
                onClick={() => {
                  setMemberForEdit(null);
                  setIsMemberDialogOpen(true);
                }}
                className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Member
              </Button>
            </Can>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-9 px-2.5 text-zinc-600 dark:text-zinc-300"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        }
      />

      {/* Household Overview Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {family.familyName} Lineage
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {members.length} Enrolled Members
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-3 flex-wrap">
              <span>
                Head of Family:{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {headMember?.fullName || "Unassigned"}
                </strong>
              </span>
              {family.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-zinc-400" />
                  {family.city}, {family.state}
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

        {/* Quick Jump Dropdown */}
        {members.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-zinc-400">Inspect Member:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Choose node...</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {members.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => handleSelectMember(m)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="truncate">{m.fullName}</span>
                    <span className="text-[10px] capitalize text-zinc-400 ml-2">
                      {m.relationshipToHead}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Main Interactive Family Tree Canvas */}
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Kinship Data Recorded"
          description="This household currently has no members registered. Add the Head of Family to establish the root lineage."
          action={{
            label: "Add Head of Family",
            onClick: () => {
              setMemberForEdit(null);
              setIsMemberDialogOpen(true);
            },
          }}
        />
      ) : (
        <FamilyTreeCanvas
          family={family}
          members={members}
          selectedMemberId={selectedMember?.id || null}
          onSelectMember={handleSelectMember}
        />
      )}

      {/* Slide-over Side Drawer with Member Details & Edit Option */}
      <FamilyTreeDrawer
        member={selectedMember}
        family={family}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedMember(null);
        }}
        onEdit={handleEditMemberFromDrawer}
      />

      {/* Edit / Add Member Dialog (Permission Controlled) */}
      <MemberFormDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        member={memberForEdit}
        familyId={family.id}
        familyName={family.familyName}
        communityId={family.communityId}
        onSubmit={handleMemberFormSubmit}
      />
    </div>
  );
}

export default function FamilyTreePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-[600px] bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <FamilyTreeContent familyId={unwrappedParams.id} />
    </Suspense>
  );
}
