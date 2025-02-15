"use client";

import React from "react";
import { Upload } from "lucide-react";
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone";
import { cn, formatBytes } from "@/lib/utils";
import { useControllableState } from "@/hooks/use-controllable-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCard } from "./FileCard";
import { EmptyCard } from "./EmptyCard";
import { toast } from "@/hooks/use-toast";

interface UploadedFile {
  url: string;
  name: string;
  key?: string;
}

interface FileWithPreview extends File {
  preview: string;
}

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: (FileWithPreview | UploadedFile)[];
  onValueChange?: React.Dispatch<React.SetStateAction<(FileWithPreview | UploadedFile)[]>>;
  onUpload?: (files: File[]) => Promise<void>;
  progresses?: Record<string, number>;
  accept?: DropzoneProps["accept"];
  maxSize?: DropzoneProps["maxSize"];
  maxFiles?: DropzoneProps["maxFiles"];
  multiple?: boolean;
  disabled?: boolean;
  deleteUploadedFile?: (fileUrl: string) => Promise<void>;
  initialFiles?: UploadedFile[];
}

function isUploadedFile(file: any): file is UploadedFile {
  return typeof file === 'object' && 'url' in file;
}

function isFileWithPreview(file: any): file is FileWithPreview {
  return file instanceof File && 'preview' in file;
}

export function FileUploader({
  value: valueProp,
  onValueChange,
  onUpload,
  progresses,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
  maxSize = 1024 * 1024 * 4,
  maxFiles = 1,
  multiple = false,
  disabled,
  deleteUploadedFile,
  initialFiles = [],
  className,
  ...dropzoneProps
}: FileUploaderProps) {
  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
    defaultValue: initialFiles,
  });

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFiles === 1 && acceptedFiles.length > 1) {
        return;
      }

      const currentFileCount = files?.length ?? 0;
      if (currentFileCount + acceptedFiles.length > maxFiles) {
        toast({
          title: "Error",
          description: `You can only upload up to ${maxFiles} files`,
          variant: "destructive",
        });
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      ) as FileWithPreview[];

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          toast({
            title: "Error",
            description: `File ${file.name} was rejected: ${errors[0].message}`,
            variant: "destructive",
          });
        });
      }

      if (onUpload) {
        try {
          await onUpload(acceptedFiles);
        } catch (error) {
          console.error('Upload error:', error);
          return;
        }
      }

      setFiles((prevFiles) => {
        if (!prevFiles) return newFiles;
        // If not multiple, replace files
        if (!multiple && maxFiles === 1) return newFiles;
        // Otherwise add to existing
        return [...prevFiles, ...newFiles];
      });
    },
    [files, maxFiles, multiple, onUpload, setFiles]
  );

  async function handleRemove(index: number) {
    if (!files) return;

    const fileToRemove = files[index];
    if (isUploadedFile(fileToRemove) && deleteUploadedFile) {
      try {
        await deleteUploadedFile(fileToRemove.url);
      } catch (error) {
        console.error('Error deleting file:', error);
        return;
      }
    }

    if (isFileWithPreview(fileToRemove)) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    setFiles((prevFiles) =>
      prevFiles ? prevFiles.filter((_, i) => i !== index) : []
    );
  }

  React.useEffect(() => {
    return () => {
      if (!files) return;
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const isDisabled = disabled || (files?.length ?? 0) >= maxFiles;

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone
        onDrop={onDrop}
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFiles}
        multiple={maxFiles > 1 || multiple}
        disabled={isDisabled}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDragActive && "border-muted-foreground/50",
              isDisabled && "pointer-events-none opacity-60",
              className
            )}
            {...dropzoneProps}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">
                  Drop the files here
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="space-y-px">
                  <p className="font-medium text-muted-foreground">
                    Drag {'"n"'} drop files here, or click to select files
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    You can upload
                    {maxFiles > 1
                      ? ` ${maxFiles === Infinity ? "multiple" : maxFiles}
                      files (up to ${formatBytes(maxSize)} each)`
                      : ` a file with ${formatBytes(maxSize)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>

      {files?.length ? (
        <ScrollArea className="h-fit w-full">
          <div className="max-h-48 space-y-4">
            {files.map((file, index) => (
              <FileCard
                key={isUploadedFile(file) ? file.url : file.name}
                file={file}
                disabled={disabled}
                onRemove={() => handleRemove(index)}
                progress={isUploadedFile(file) ? undefined : progresses?.[file.name]}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <EmptyCard
          title="No file selected"
          description="Select a file to see the preview"
        />
      )}
    </div>
  );
}