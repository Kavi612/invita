"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Member, RelationshipToHead, MemberStatus, Role } from "@/types";
import { UserPlus, Loader2 } from "lucide-react";

const memberSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  relationshipToHead: z.enum([
    "head",
    "spouse",
    "child",
    "parent",
    "sibling",
    "relative",
    "other",
  ]),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  status: z.enum(["active", "invited", "pending", "suspended"]).default("active"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  familyId: string;
  familyName?: string;
  communityId: string;
  onSubmit: (data: MemberFormValues) => Promise<void>;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
  familyId,
  familyName,
  communityId,
  onSubmit,
}: MemberFormDialogProps) {
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      fullName: "",
      relationshipToHead: "child",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "prefer_not_to_say",
      status: "active",
    },
  });

  useEffect(() => {
    if (member) {
      reset({
        fullName: member.fullName,
        relationshipToHead: member.relationshipToHead || "other",
        email: member.email || "",
        phone: member.phone || "",
        dateOfBirth: member.dateOfBirth || "",
        gender: member.gender || "prefer_not_to_say",
        status: member.status || "active",
      });
    } else {
      reset({
        fullName: "",
        relationshipToHead: "child",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "prefer_not_to_say",
        status: "active",
      });
    }
  }, [member, reset]);

  const handleFormSubmit = async (values: MemberFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? "Edit Family Member" : "Add Member to Family"}
              </DialogTitle>
              <DialogDescription>
                {familyName ? `Belongs to ${familyName}` : "Register a household member."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full Name *
            </label>
            <Input
              placeholder="e.g. Julian Thornton"
              {...register("fullName")}
              className={errors.fullName ? "border-rose-500" : ""}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* Relationship to Head */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Relationship to Head of Family *
            </label>
            <select
              {...register("relationshipToHead")}
              className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="head">Head of Family</option>
              <option value="spouse">Spouse / Partner</option>
              <option value="child">Child / Dependent</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="relative">Relative / Extended</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="optional@email.com"
                {...register("email")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
              />
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Date of Birth
              </label>
              <Input type="date" {...register("dateOfBirth")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Gender
              </label>
              <select
                {...register("gender")}
                className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Member Status */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Membership Status
            </label>
            <select
              {...register("status")}
              className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="active">Active Member</option>
              <option value="invited">Invited</option>
              <option value="pending">Pending Verification</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Save Member" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
