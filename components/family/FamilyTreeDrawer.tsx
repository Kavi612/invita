"use client";

import React, { useState } from "react";
import { Member, Family } from "@/types";
import { Can } from "@/components/shared/Can";
import { Button } from "@/components/ui/button";
import {
  X,
  Crown,
  Heart,
  Baby,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface FamilyTreeDrawerProps {
  member: Member | null;
  family: Family;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
}

export function FamilyTreeDrawer({
  member,
  family,
  isOpen,
  onClose,
  onEdit,
}: FamilyTreeDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const isHead = member.relationshipToHead === "head" || member.id === family.headOfFamilyId;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate age from dateOfBirth if available
  const getAge = (dobString?: string) => {
    if (!dobString) return null;
    try {
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  const age = getAge(member.dateOfBirth);

  const getRelationshipBadge = (rel?: string) => {
    switch (rel) {
      case "head":
        return {
          label: "Head of Family",
          icon: Crown,
          bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        };
      case "spouse":
        return {
          label: "Spouse",
          icon: Heart,
          bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        };
      case "child":
        return {
          label: "Child / Offspring",
          icon: Baby,
          bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        };
      case "parent":
        return {
          label: "Parent / Elder",
          icon: User,
          bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
        };
      case "sibling":
        return {
          label: "Sibling",
          icon: User,
          bg: "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800",
        };
      default:
        return {
          label: rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : "Family Member",
          icon: User,
          bg: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
        };
    }
  };

  const badgeInfo = getRelationshipBadge(member.relationshipToHead);
  const RelIcon = badgeInfo.icon;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-200/80 dark:border-zinc-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Member Profile
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {family.familyName}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        {/* Hero Card */}
        <div
          className={`relative p-5 rounded-2xl border text-center transition-all ${
            isHead
              ? "bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/50 dark:border-amber-500/40 shadow-sm"
              : "bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800"
          }`}
        >
          {isHead && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
              <Crown className="h-3 w-3" />
              Head of Family
            </div>
          )}

          {/* Avatar */}
          <div className="relative mx-auto w-24 h-24 mb-3">
            <div
              className={`w-full h-full rounded-2xl overflow-hidden border-2 shadow-md ${
                isHead
                  ? "border-amber-400 ring-4 ring-amber-400/20"
                  : "border-white dark:border-zinc-700 ring-2 ring-zinc-200/60 dark:ring-zinc-800"
              }`}
            >
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">
                  {member.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
              )}
            </div>

            {/* Status indicator */}
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-xs ${
                member.status === "active"
                  ? "bg-emerald-500"
                  : member.status === "invited"
                  ? "bg-amber-500"
                  : "bg-zinc-400"
              }`}
              title={`Status: ${member.status}`}
            />
          </div>

          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {member.fullName}
          </h3>

          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeInfo.bg}`}
            >
              <RelIcon className="h-3 w-3" />
              {badgeInfo.label}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Shield className="h-3 w-3 text-zinc-500" />
              {member.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Vital Info Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Demographic & Vital Details
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                Calculated Age
              </span>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {age !== null ? `${age} years old` : "Not provided"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                Gender
              </span>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 capitalize mt-0.5">
                {member.gender?.replace(/_/g, " ") || "Unspecified"}
              </p>
            </div>

            {member.dateOfBirth && (
              <div className="col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                    Date of Birth
                  </span>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    {new Date(member.dateOfBirth).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Contact & Channels
          </h4>

          <div className="space-y-2">
            {/* Email */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-zinc-400 block">Email</span>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                    {member.email || "No email on record"}
                  </span>
                </div>
              </div>

              {member.email && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(member.email!, "email")}
                    aria-label="Copy email"
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={`mailto:${member.email}`}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-indigo-600 transition-colors"
                    title="Send Email"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-zinc-400 block">Phone</span>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                    {member.phone || "No phone on record"}
                  </span>
                </div>
              </div>

              {member.phone && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(member.phone!, "phone")}
                    aria-label="Copy phone"
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {copiedField === "phone" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={`tel:${member.phone}`}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-emerald-600 transition-colors"
                    title="Call Member"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registry & Meta */}
        <div className="p-3.5 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 text-xs space-y-1.5">
          <div className="flex justify-between text-zinc-500">
            <span>Member Record ID:</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {member.id}
            </span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Membership Status:</span>
            <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
              {member.status}
            </span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Registered On:</span>
            <span>
              {new Date(member.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer with Permission-Based Edit Option */}
      <div className="p-4 sm:p-5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-3">
        <Can
          action="family:manage"
          fallback={
            <div className="w-full text-center text-xs text-zinc-400 italic">
              Viewing in read-only mode. Editing requires Family Head or Admin permissions.
            </div>
          }
        >
          <Button
            onClick={() => onEdit(member)}
            className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm"
          >
            <Edit2 className="h-4 w-4" />
            Edit Member Details
          </Button>
        </Can>
      </div>
    </div>
  );
}
