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
import { Family, Member } from "@/types";
import { Home, Loader2, UserCheck } from "lucide-react";

const familySchema = z.object({
  familyName: z.string().min(2, "Family name must be at least 2 characters"),
  headOfFamilyId: z.string().min(1, "Please select or assign a Head of Family"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
});

type FamilyFormValues = z.infer<typeof familySchema>;

interface FamilyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family?: Family | null;
  communityId: string;
  availableMembers: Member[];
  onSubmit: (data: FamilyFormValues) => Promise<void>;
}

export function FamilyFormDialog({
  open,
  onOpenChange,
  family,
  communityId,
  availableMembers,
  onSubmit,
}: FamilyFormDialogProps) {
  const isEditing = !!family;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      familyName: "",
      headOfFamilyId: "",
      address: "",
      city: "",
      state: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (family) {
      reset({
        familyName: family.familyName,
        headOfFamilyId: family.headOfFamilyId,
        address: family.address || "",
        city: family.city || "",
        state: family.state || "",
        phone: family.phone || "",
      });
    } else {
      reset({
        familyName: "",
        headOfFamilyId: availableMembers[0]?.id || "",
        address: "",
        city: "",
        state: "",
        phone: "",
      });
    }
  }, [family, availableMembers, reset]);

  const handleFormSubmit = async (values: FamilyFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? "Edit Family Unit" : "Register New Family"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update household details and head of family designation."
                  : "Establish a family lineage to coordinate group invitations and collective RSVPs."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Family Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Family / Household Name *
            </label>
            <Input
              placeholder="e.g. Thornton Dynasty, Vance Household"
              {...register("familyName")}
              className={errors.familyName ? "border-rose-500" : ""}
            />
            {errors.familyName && (
              <p className="mt-1 text-xs text-rose-500">{errors.familyName.message}</p>
            )}
          </div>

          {/* Head of Family Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Head of Family (Representative) *</span>
              <span className="text-[11px] text-zinc-400 font-normal">Submits group RSVPs</span>
            </label>
            <div className="relative">
              <select
                {...register("headOfFamilyId")}
                className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">-- Choose Head of Family --</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.userId || m.id}>
                    {m.fullName} {m.email ? `(${m.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {errors.headOfFamilyId && (
              <p className="mt-1 text-xs text-rose-500">{errors.headOfFamilyId.message}</p>
            )}
          </div>

          {/* Address Line */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Street Address
            </label>
            <Input
              placeholder="e.g. 742 Evergreen Terrace"
              {...register("address")}
            />
          </div>

          {/* City & State Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                City
              </label>
              <Input placeholder="San Francisco" {...register("city")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                State / Province
              </label>
              <Input placeholder="CA" {...register("state")} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Primary Household Phone
            </label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register("phone")}
            />
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
              {isEditing ? "Save Changes" : "Register Family"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
