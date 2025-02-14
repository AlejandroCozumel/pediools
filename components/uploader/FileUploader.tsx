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

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: File[];
  onValueChange?: React.Dispatch<React.SetStateAction<File[]>>;
  onUpload?: (files: File[]) => Promise<void>;
  progresses?: Record<string, number>;
  accept?: DropzoneProps["accept"];
  maxSize?: DropzoneProps["maxSize"];
  maxFiles?: DropzoneProps["maxFiles"];
  multiple?: boolean;
  disabled?: boolean;
  deleteUploadedFile?: (fileUrl: string) => Promise<void>;
}

export function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progresses,
    accept = { files: [] },
    maxSize = 1024 * 1024 * 4,
    maxFiles = 1,
    multiple = false,
    disabled,
    deleteUploadedFile,
    className,
    ...dropzoneProps
  } = props;

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFiles === 1 && acceptedFiles.length > 1) {
        return;
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFiles) {
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      const updatedFiles = files ? [...files, ...newFiles] : newFiles;

      setFiles(updatedFiles);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => {
          console.error(`File ${file.name} was rejected`);
          toast({
            title: "Error",
            description: `File ${file.name} was rejected, check the file type`,
            variant: "destructive",
          });
        });
      }

      if (
        onUpload &&
        updatedFiles.length > 0 &&
        updatedFiles.length <= maxFiles
      ) {
        onUpload(updatedFiles);
      }
    },
    [files, maxFiles, multiple, onUpload, setFiles]
  );

  function handleRemove(index: number) {
    if (!files) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onValueChange?.(newFiles);

    // UNCOMMENT TO HANDLE REMOVE WITH UUID
    // const fileToRemove = files[index];

    // if (fileToRemove) {
    //   deleteUploadedFile(fileToRemove.name);
    // }
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
                  <Upload
                    className="size-7 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-medium text-muted-foreground">
                  Drop the files here
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <Upload
                    className="size-7 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-px">
                  <p className="font-medium text-muted-foreground">
                    Drag {"n"} drop files here, or click to select files
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    You can upload
                    {maxFiles > 1
                      ? ` ${maxFiles === Infinity ? "multiple" : maxFiles}
                      files (up to ${formatBytes(maxSize)} each)`
                      : ` a file with ${formatBytes(maxSize)}`}
                  </p>
                  {maxFiles === files?.length && (
                    <p className="text-sm text-green-700">
                      Maximum number of files are reached: {maxFiles}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
      {files?.length ? (
        <ScrollArea className="h-fit w-full">
          <div className="max-h-48 space-y-4">
            {files?.map((file, index) => (
              <FileCard
                disabled={disabled}
                key={file.name}
                file={file}
                onRemove={() => handleRemove(index)}
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

function isFileWithPreview(file: File): file is File & { preview: string } {
  return "preview" in file && typeof file.preview === "string";
}
