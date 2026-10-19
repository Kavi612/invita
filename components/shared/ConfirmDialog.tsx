"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "warning";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const effectiveLoading = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      if (onOpenChange) {
        onOpenChange(false);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const iconConfig = {
    destructive: {
      Icon: Trash2,
      wrapperClass: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
      buttonVariant: "destructive" as const,
    },
    warning: {
      Icon: AlertTriangle,
      wrapperClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      buttonVariant: "default" as const,
    },
    default: {
      Icon: Info,
      wrapperClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
      buttonVariant: "default" as const,
    },
  }[variant];

  const IconComponent = iconConfig.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px]">
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              iconConfig.wrapperClass
            )}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 pt-0.5">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-base font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 pt-1">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={effectiveLoading}
            className="sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={iconConfig.buttonVariant}
            onClick={handleConfirm}
            disabled={effectiveLoading}
            className="sm:w-auto gap-2"
          >
            {effectiveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
