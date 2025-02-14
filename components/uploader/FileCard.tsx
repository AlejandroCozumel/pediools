import React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { formatBytes } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface FileCardProps {
  file: File & { preview?: string };
  disabled?: boolean;
  onRemove: () => void;
  progress?: number;
}

export function FileCard({
  file,
  onRemove,
  progress,
  disabled,
}: FileCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        {file.preview && (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={file.preview}
              alt={file.name}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-md"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium truncate max-w-[300px]">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </p>
          {progress !== undefined && (
            <Progress value={progress} className="mt-1 h-1" />
          )}
          {disabled ? (
            <Loader2 className="animate-spin h-4 w-4 text-purple-500" />
          ) : null}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 rounded-full p-1 text-red-600 hover:bg-red-200"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
