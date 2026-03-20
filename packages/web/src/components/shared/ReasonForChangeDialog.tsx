"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReasonForChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export function ReasonForChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Reason for Change",
  description = "Please provide a reason for this mutating action for auditing purposes.",
  actionLabel = "Confirm",
}: ReasonForChangeDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="reason" className="text-sm font-semibold text-foreground mb-2 block">
            Reason for change
          </label>
          <Textarea
            id="reason"
            placeholder="Describe why you are making this change..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[120px] resize-none focus:ring-primary-500 border-border"
            autoFocus
          />
          <p className="mt-2 text-[11px] text-muted-foreground italic">
            This action will be recorded in the audit trail with Trace ID: <span className="font-mono bg-muted/40 px-1 rounded">TRC-{Math.random().toString(36).substring(7).toUpperCase()}</span>
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={handleConfirm}
            className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
