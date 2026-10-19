"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubCommunity, Member } from "@/types";
import { Can } from "@/lib/permissions";
import {
  Users,
  Sparkles,
  CalendarDays,
  HeartHandshake,
  Building2,
  Lock,
  Globe,
  UserPlus,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SubCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subCommunity?: SubCommunity | null;
  communityId: string;
  allMembers: Member[];
  onSaveGroup: (data: {
    name: string;
    description: string;
    isPrivate: boolean;
    iconName?: string;
  }) => Promise<void>;
  onAddMember?: (groupId: string, memberId: string) => Promise<void>;
  onRemoveMember?: (groupId: string, memberId: string) => Promise<void>;
}

export function SubCommunityModal({
  open,
  onOpenChange,
  subCommunity,
  communityId,
  allMembers,
  onSaveGroup,
  onAddMember,
  onRemoveMember,
}: SubCommunityModalProps) {
  const isEditing = !!subCommunity;

  const [name, setName] = useState(subCommunity?.name || "");
  const [description, setDescription] = useState(subCommunity?.description || "");
  const [isPrivate, setIsPrivate] = useState(subCommunity?.isPrivate ?? false);
  const [iconName, setIconName] = useState(subCommunity?.iconName || "Sparkles");

  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (subCommunity) {
      setName(subCommunity.name);
      setDescription(subCommunity.description);
      setIsPrivate(subCommunity.isPrivate);
      setIconName(subCommunity.iconName || "Sparkles");
    } else {
      setName("");
      setDescription("");
      setIsPrivate(false);
      setIconName("Sparkles");
    }
  }, [subCommunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await onSaveGroup({ name, description, isPrivate, iconName });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!subCommunity || !selectedMemberToAdd || !onAddMember) return;
    try {
      setActionLoadingId(selectedMemberToAdd);
      await onAddMember(subCommunity.id, selectedMemberToAdd);
      setSelectedMemberToAdd("");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!subCommunity || !onRemoveMember) return;
    try {
      setActionLoadingId(memberId);
      await onRemoveMember(subCommunity.id, memberId);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Members currently in this group
  const currentGroupMembers = allMembers.filter((m) =>
    subCommunity?.memberIds?.includes(m.id)
  );

  // Members available to be added
  const availableToAdd = allMembers.filter(
    (m) => !subCommunity?.memberIds?.includes(m.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? `Group: ${subCommunity.name}` : "Create Custom Sub-Community Group"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Manage group participants, permissions, and focus topics."
                  : "Organize targeted member circles (e.g. Committee, Youth Council, Book Club)."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Group Details */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Group Title *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Centennial Gala Committee, Youth Mentors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description & Purpose
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this subgroup coordinate?"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              {isPrivate ? (
                <Lock className="h-4 w-4 text-amber-500" />
              ) : (
                <Globe className="h-4 w-4 text-emerald-500" />
              )}
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {isPrivate ? "Private (Invite Only)" : "Open Community Group"}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {isPrivate
                    ? "Only appointed administrators can add new participants."
                    : "Any verified community member may join and contribute."}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {!isEditing && (
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !name.trim()} className="gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Sub-Community
              </Button>
            </DialogFooter>
          )}
        </form>

        {/* Existing Group Member Management (WhatsApp Group Style) */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Group Members ({currentGroupMembers.length})
              </span>
            </div>

            {/* Add Member Dropdown Control */}
            <Can action="community:edit">
              <div className="flex items-center gap-2">
                <select
                  value={selectedMemberToAdd}
                  onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">-- Add member to this group... --</option>
                  {availableToAdd.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.email || "No email"})
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={!selectedMemberToAdd || !!actionLoadingId}
                  className="gap-1.5 text-xs shrink-0"
                >
                  {actionLoadingId === selectedMemberToAdd ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  Add to Group
                </Button>
              </div>
            </Can>

            {/* Member List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-52 overflow-y-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
              {currentGroupMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  No members added yet. Add participants above!
                </div>
              ) : (
                currentGroupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                        <AvatarFallback>{member.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                          {member.fullName}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {member.email || "Member"}
                        </span>
                      </div>
                    </div>

                    <Can action="community:edit">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoadingId === member.id}
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Remove from group"
                      >
                        {actionLoadingId === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </Can>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Details
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
