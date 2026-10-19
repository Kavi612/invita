"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Event, Community, SubCommunity, Family, Member, Invitation } from "@/types";
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
import {
  Users,
  Home,
  UserCheck,
  UserPlus,
  Send,
  Check,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Globe,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface OutsideGuestInput {
  name: string;
  email: string;
  phone: string;
  allowedGuestsCount: number;
}

interface InviteeSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  communityId?: string;
  onSuccess?: () => void;
}

export function InviteeSelectorModal({
  open,
  onOpenChange,
  event,
  communityId = "comm-1",
  onSuccess,
}: InviteeSelectorModalProps) {
  const queryClient = useQueryClient();

  // Active invitee selection category tab
  const [activeTab, setActiveTab] = useState<
    "community" | "sub_communities" | "families" | "members" | "outside_guests"
  >("families");

  // Selection state
  const [inviteEntireCommunity, setInviteEntireCommunity] = useState(false);
  const [selectedSubCommIds, setSelectedSubCommIds] = useState<string[]>([]);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [outsideGuests, setOutsideGuests] = useState<OutsideGuestInput[]>([
    { name: "", email: "", phone: "", allowedGuestsCount: 2 },
  ]);
  const [customMessage, setCustomMessage] = useState(
    `We cordially request the pleasure of your company at the ${event.title}.`
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries for data
  const { data: community } = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => api.communities.getById(communityId),
  });

  const { data: subCommunities = [] } = useQuery({
    queryKey: ["sub-communities", communityId],
    queryFn: () => api.subCommunities.list(communityId),
  });

  const { data: families = [] } = useQuery({
    queryKey: ["families", communityId],
    queryFn: () => api.families.list(communityId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", { communityId }],
    queryFn: () => api.members.list({ communityId }),
  });

  // Existing invitations for this event to avoid duplicates
  const { data: existingInvitations = [] } = useQuery({
    queryKey: ["invitations", event.id],
    queryFn: () => api.invitations.list(event.id),
  });

  const existingRecipientIds = new Set(existingInvitations.map((i) => i.recipientId));

  // Outside guest helpers
  const handleAddOutsideGuestRow = () => {
    setOutsideGuests((prev) => [
      ...prev,
      { name: "", email: "", phone: "", allowedGuestsCount: 2 },
    ]);
  };

  const handleRemoveOutsideGuestRow = (index: number) => {
    setOutsideGuests((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOutsideGuest = (
    index: number,
    field: keyof OutsideGuestInput,
    val: any
  ) => {
    setOutsideGuests((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Toggle selection helpers
  const toggleSubComm = (id: string) => {
    setSelectedSubCommIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleFamily = (id: string) => {
    setSelectedFamilyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered lists
  const filteredSubCommunities = subCommunities.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFamilies = families.filter(
    (f) =>
      f.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validOutsideGuests = outsideGuests.filter((g) => g.name.trim().length > 0);

  // Total calculated headcount
  const totalEstimatedGuests =
    (inviteEntireCommunity ? community?.memberCount || 50 : 0) +
    selectedSubCommIds.reduce((sum, id) => {
      const sc = subCommunities.find((s) => s.id === id);
      return sum + (sc?.memberIds?.length || 5);
    }, 0) +
    selectedFamilyIds.reduce((sum, id) => {
      const fam = families.find((f) => f.id === id);
      return sum + (fam?.memberCount || 4);
    }, 0) +
    selectedMemberIds.length +
    validOutsideGuests.reduce((sum, g) => sum + (g.allowedGuestsCount || 1), 0);

  const totalSelectedEntities =
    (inviteEntireCommunity ? 1 : 0) +
    selectedSubCommIds.length +
    selectedFamilyIds.length +
    selectedMemberIds.length +
    validOutsideGuests.length;

  const handleSendInvitations = async () => {
    if (totalSelectedEntities === 0) return;

    try {
      setIsSubmitting(true);
      const itemsToCreate: Omit<Invitation, "id" | "status" | "sentAt">[] = [];

      // 1. Entire Community
      if (inviteEntireCommunity && community) {
        itemsToCreate.push({
          eventId: event.id,
          eventTitle: event.title,
          invitedById: event.organizerId || "user-1",
          recipientType: "sub_community",
          recipientId: community.id,
          recipientName: `${community.name} (General Delegation)`,
          inviteCode: `COMM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          customMessage,
          allowedGuestsCount: community.memberCount || 50,
        });
      }

      // 2. Sub-Communities
      selectedSubCommIds.forEach((subId) => {
        const sc = subCommunities.find((s) => s.id === subId);
        if (sc) {
          itemsToCreate.push({
            eventId: event.id,
            eventTitle: event.title,
            invitedById: event.organizerId || "user-1",
            recipientType: "sub_community",
            recipientId: sc.id,
            recipientName: sc.name,
            inviteCode: `GRP-${sc.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
            customMessage,
            allowedGuestsCount: sc.memberIds?.length || 10,
          });
        }
      });

      // 3. Families
      selectedFamilyIds.forEach((famId) => {
        const fam = families.find((f) => f.id === famId);
        if (fam) {
          itemsToCreate.push({
            eventId: event.id,
            eventTitle: event.title,
            invitedById: event.organizerId || "user-1",
            recipientType: "family",
            recipientId: fam.id,
            recipientName: fam.familyName,
            recipientPhone: fam.phone,
            inviteCode: `FAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            customMessage,
            allowedGuestsCount: fam.memberCount || 4,
          });
        }
      });

      // 4. Individual Members
      selectedMemberIds.forEach((memId) => {
        const mem = members.find((m) => m.id === memId);
        if (mem) {
          itemsToCreate.push({
            eventId: event.id,
            eventTitle: event.title,
            invitedById: event.organizerId || "user-1",
            recipientType: "individual",
            recipientId: mem.id,
            recipientName: mem.fullName,
            recipientEmail: mem.email,
            recipientPhone: mem.phone,
            inviteCode: `MEM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            customMessage,
            allowedGuestsCount: 2,
          });
        }
      });

      // 5. Outside Guests
      validOutsideGuests.forEach((og, idx) => {
        itemsToCreate.push({
          eventId: event.id,
          eventTitle: event.title,
          invitedById: event.organizerId || "user-1",
          recipientType: "outside_guest",
          recipientId: `ext-${Date.now()}-${idx}`,
          recipientName: og.name,
          recipientEmail: og.email || undefined,
          recipientPhone: og.phone || undefined,
          inviteCode: `GUEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          customMessage,
          allowedGuestsCount: og.allowedGuestsCount || 1,
        });
      });

      await api.invitations.bulkCreate(itemsToCreate);
      queryClient.invalidateQueries({ queryKey: ["invitations", event.id] });
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to bulk create invitations", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Select Invitees & Issue Invitations
              </DialogTitle>
              <DialogDescription className="text-xs">
                Invite entire communities, sub-community circles, households, individual members, or outside guests to <strong className="text-zinc-800 dark:text-zinc-200">{event.title}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Target Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("families")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === "families"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Home className="h-3.5 w-3.5 text-emerald-600" />
            Households / Families ({selectedFamilyIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sub_communities")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === "sub_communities"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            Sub-Communities ({selectedSubCommIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === "members"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Individual Members ({selectedMemberIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outside_guests")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === "outside_guests"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 text-amber-600" />
            Outside Guests ({validOutsideGuests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("community")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === "community"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-purple-600" />
            Entire Community
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="space-y-4 min-h-[280px]">
          {/* Search bar for lists */}
          {activeTab !== "community" && activeTab !== "outside_guests" && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={`Search ${activeTab.replace("_", " ")}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          )}

          {/* 1. Households / Families */}
          {activeTab === "families" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredFamilies.map((fam) => {
                const isSelected = selectedFamilyIds.includes(fam.id);
                const isAlreadyInvited = existingRecipientIds.has(fam.id);

                return (
                  <div
                    key={fam.id}
                    onClick={() => !isAlreadyInvited && toggleFamily(fam.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isAlreadyInvited
                        ? "opacity-60 bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 hover:border-zinc-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {fam.familyName}
                        </h4>
                        {isAlreadyInvited && (
                          <span className="text-[10px] text-zinc-400">(Invited)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {fam.memberCount || 4} Members • {fam.city || "San Francisco"}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Sub-Communities */}
          {activeTab === "sub_communities" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredSubCommunities.map((sub) => {
                const isSelected = selectedSubCommIds.includes(sub.id);
                const isAlreadyInvited = existingRecipientIds.has(sub.id);

                return (
                  <div
                    key={sub.id}
                    onClick={() => !isAlreadyInvited && toggleSubComm(sub.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isAlreadyInvited
                        ? "opacity-60 bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 hover:border-zinc-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {sub.name}
                        </h4>
                        {isAlreadyInvited && (
                          <span className="text-[10px] text-zinc-400">(Invited)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                        {sub.description}
                      </p>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {sub.memberIds?.length || 0} participants
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Individual Members */}
          {activeTab === "members" && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                const isAlreadyInvited = existingRecipientIds.has(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => !isAlreadyInvited && toggleMember(member.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isAlreadyInvited
                        ? "opacity-60 bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20"
                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {member.fullName[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {member.fullName}
                          </h4>
                          <span className="text-[10px] capitalize px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {member.relationshipToHead || member.role.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 truncate block">
                          {member.email || member.phone || "No direct email"}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. Outside Guests */}
          {activeTab === "outside_guests" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Add non-registered external guests, VIPs, or relatives without community accounts.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOutsideGuestRow}
                  className="h-7 text-xs gap-1 text-indigo-600 border-indigo-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Guest
                </Button>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {outsideGuests.map((guest, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                  >
                    <div className="sm:col-span-1">
                      <Input
                        placeholder="Guest Full Name *"
                        value={guest.name}
                        onChange={(e) =>
                          handleUpdateOutsideGuest(idx, "name", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Input
                        placeholder="Email (for digital invite)"
                        value={guest.email}
                        onChange={(e) =>
                          handleUpdateOutsideGuest(idx, "email", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Input
                        placeholder="Phone (optional)"
                        value={guest.phone}
                        onChange={(e) =>
                          handleUpdateOutsideGuest(idx, "phone", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
                        <span>+1s:</span>
                        <select
                          value={guest.allowedGuestsCount}
                          onChange={(e) =>
                            handleUpdateOutsideGuest(
                              idx,
                              "allowedGuestsCount",
                              parseInt(e.target.value)
                            )
                          }
                          className="h-8 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={4}>4</option>
                          <option value={5}>5+</option>
                        </select>
                      </div>

                      {outsideGuests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOutsideGuestRow(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Entire Community */}
          {activeTab === "community" && (
            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Broadcast Invite to Entire Community
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  Issue a general community-wide invitation to all{" "}
                  <strong>{community?.memberCount || 142} registered members</strong> of{" "}
                  {community?.name}.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant={inviteEntireCommunity ? "default" : "outline"}
                  onClick={() => setInviteEntireCommunity((v) => !v)}
                  className={`gap-2 text-xs ${
                    inviteEntireCommunity
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "border-purple-300 text-purple-700"
                  }`}
                >
                  {inviteEntireCommunity ? (
                    <>
                      <Check className="h-4 w-4" /> Entire Community Selected
                    </>
                  ) : (
                    "Select All Community Members"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Message input */}
        <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Custom Invitation Message (Optional)
          </label>
          <textarea
            rows={2}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add personal greetings or instructions for the invitees..."
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Summary Footer */}
        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Selected: <strong className="text-zinc-900 dark:text-zinc-100">{totalSelectedEntities} entities</strong>{" "}
            (~{totalEstimatedGuests} potential attendees)
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendInvitations}
              disabled={isSubmitting || totalSelectedEntities === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Issuing Invitations...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Dispatch {totalSelectedEntities} Invitations
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
