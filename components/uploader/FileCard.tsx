"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatBytes } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface UploadedFile {
  url: string;
  name: string;
  key?: string;
}

interface FileWithPreview extends File {
  preview: string;
}

interface FileCardProps {
  file: FileWithPreview | UploadedFile;
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
  const isUploadedFile = (file: any): file is UploadedFile => {
    return 'url' in file;
  };

  const preview = isUploadedFile(file) ? file.url : file.preview;
  const fileName = isUploadedFile(file) ? file.name : file.name;
  const fileSize = !isUploadedFile(file) ? formatBytes(file.size) : null;

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        {preview && (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={preview}
              alt={fileName}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-md"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium truncate max-w-[300px]">
            {fileName}
          </p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">{fileSize}</p>
          )}
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