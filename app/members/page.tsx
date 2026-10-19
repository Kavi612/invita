"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/use-auth";
import { Can } from "@/lib/permissions";
import { PageHeader, DataTable, ColumnDef, StatusBadge, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MemberFormDialog } from "@/components/community/MemberFormDialog";
import { Member } from "@/types";
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Home,
  Mail,
  Phone,
} from "lucide-react";

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { activeCommunityId } = useAuthStore();

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<Member | null>(null);

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

  const { data: members = [], isLoading: isMembersLoading, isError, error, refetch } = useQuery({
    queryKey: ["members", activeCommunityId],
    queryFn: () => api.members.list({ communityId: activeCommunityId }),
  });

  const { data: families = [] } = useQuery({
    queryKey: ["families", activeCommunityId],
    queryFn: () => api.families.list(activeCommunityId),
  });

  const createMemberMutation = useMutation({
    mutationFn: (data: any) =>
      api.members.create({
        ...data,
        communityId: activeCommunityId,
        role: "member",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] }),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.members.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] }),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => api.members.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", activeCommunityId] }),
  });

  const columns: ColumnDef<Member>[] = [
    {
      key: "fullName",
      header: "Member Name",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatarUrl} alt={row.fullName} />
            <AvatarFallback>{row.fullName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {row.fullName}
            </span>
            <span className="text-[11px] text-zinc-400 capitalize">
              {row.gender ? `${row.gender} · ` : ""}Role: {row.role}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "familyId",
      header: "Family Household",
      sortable: true,
      cell: (row) => {
        const fam = families.find((f) => f.id === row.familyId);
        return (
          <div className="flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {fam ? fam.familyName : "Independent"}
            </span>
            <span className="text-[10px] capitalize px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {row.relationshipToHead || "Member"}
            </span>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Contact",
      cell: (row) => (
        <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
          {row.email && (
            <div className="flex items-center gap-1 truncate max-w-[180px]">
              <Mail className="h-3 w-3 text-zinc-400" />
              <span>{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Phone className="h-3 w-3 text-zinc-400" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Can action="member:edit">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectedMemberForEdit(row);
                setIsMemberDialogOpen(true);
              }}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
              title="Edit Profile"
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
                  title: `Remove ${row.fullName}?`,
                  description: `Are you sure you want to remove ${row.fullName} from the community directory?`,
                  onConfirm: async () => {
                    await deleteMemberMutation.mutateAsync(row.id);
                  },
                });
              }}
              className="h-8 w-8 text-zinc-400 hover:text-rose-600"
              title="Delete Member"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Members Directory"
        description="View registered community members, verify household affiliations, and manage directory records."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members Directory" },
        ]}
        actions={
          <Can action="member:invite">
            <Button
              onClick={() => {
                setSelectedMemberForEdit(null);
                setIsMemberDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </Can>
        }
      />

      {isError && (
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-semibold text-sm">Failed to load member records</p>
              <p className="text-xs">{String(error || "Network error occurred")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <DataTable
        data={members}
        columns={columns}
        searchKey="fullName"
        searchPlaceholder="Search members by name..."
        pageSize={10}
        isLoading={isMembersLoading}
      />

      {/* Member Form Dialog */}
      <MemberFormDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        member={selectedMemberForEdit}
        familyId={selectedMemberForEdit?.familyId || families[0]?.id || "fam-1"}
        communityId={activeCommunityId}
        onSubmit={async (data) => {
          if (selectedMemberForEdit) {
            await updateMemberMutation.mutateAsync({ id: selectedMemberForEdit.id, data });
          } else {
            await createMemberMutation.mutateAsync({
              ...data,
              familyId: families[0]?.id || "fam-1",
            });
          }
        }}
      />

      {/* Confirm Delete Dialog */}
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
