import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteModalProps {
  triggerElement?: React.ReactNode;
  title?: string;
  description?: string;
  onConfirmDelete: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export function DeleteModal({
  triggerElement,
  title = "Are you sure?",
  description = "This action cannot be undone. This will permanently delete this item.",
  onConfirmDelete,
  isOpen,
  onOpenChange,
  isLoading = false,
}: DeleteModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerElement && (
        <AlertDialogTrigger asChild>{triggerElement}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}