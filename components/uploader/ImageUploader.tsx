import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Dropzone, { type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FileWithPreview extends File {
  preview: string;
  id: string;
}

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  uploadedFiles?: Array<{ url: string; name: string }>;
  progresses?: Record<string, number>;
  deleteUploadedFile?: (fileUrl: string) => Promise<void>;
}

interface SortableImageProps {
  file: FileWithPreview;
  onRemove: (id: string) => void;
  isCoverImage?: boolean;
}

function SortableImage({
  file,
  onRemove,
  isCoverImage = false
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-move"
      />
      <img
        src={file.preview}
        alt={file.name}
        className="w-full h-full object-cover rounded-lg"
      />
      {isCoverImage && (
        <div className="absolute top-2 left-2 z-20 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
          Cover Image
        </div>
      )}
      <button
        onClick={() => onRemove(file.id)}
        className="z-10 absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg
                   opacity-0 group-hover:opacity-100 transition-opacity
                   hover:bg-red-50"
        type="button"
      >
        <X className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}

export function ImageUploader({
  onUpload,
  maxSize = 1024 * 1024 * 4,
  maxFiles = 10,
  disabled = false,
  uploadedFiles = [],
  progresses = {},
  deleteUploadedFile,
  ...props
}: ImageUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{ url: string; name: string }>>(uploadedFiles);

  // Update existingFiles when uploadedFiles prop changes
  React.useEffect(() => {
    setExistingFiles(uploadedFiles);
  }, [uploadedFiles]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Validate max files
      const totalFiles = files.length + existingFiles.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        toast({
          title: "Error",
          description: `You can only upload up to ${maxFiles} images`,
          variant: "destructive",
        });
        return;
      }

      // Create files with preview and unique ID
      const newFiles = acceptedFiles.map(
        (file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }) as FileWithPreview
      );

      // Add new files
      setFiles((prev) => [...prev, ...newFiles]);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          toast({
            title: "Error",
            description: `File ${file.name} was rejected: ${errors[0].message}`,
            variant: "destructive",
          });
        });
      }
    },
    [files, existingFiles, maxFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const removeExistingFile = (fileToRemove: { url: string; name: string }) => {
    setExistingFiles((prev) =>
      prev.filter((file) => file.url !== fileToRemove.url)
    );

    // If a deletion function is provided, call it
    if (deleteUploadedFile) {
      deleteUploadedFile(fileToRemove.url);
    }
  };

  const handleUpload = async () => {
    if (files.length > 0 && onUpload) {
      await onUpload(files);
      // Do not clear files here
      setFiles([]);
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={[
            ...files.map((file) => file.id),
            ...existingFiles.map((file) => file.url)
          ]}
          strategy={rectSortingStrategy}
        >
          <div className="w-full">
            {/* Dropzone Upload Area */}
            <Dropzone
              onDrop={onDrop}
              maxSize={maxSize}
              maxFiles={maxFiles}
              multiple={true}
              disabled={disabled || (files.length + existingFiles.length) >= maxFiles}
              accept={{
                "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
              }}
            >
              {({ getRootProps, getInputProps, isDragActive }) => (
                <div
                  {...getRootProps()}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2",
                    "border-2 border-dashed rounded-lg p-4 hover:border-gray-400 transition",
                    "cursor-pointer aspect-square",
                    "bg-gray-50 hover:bg-gray-100",
                    isDragActive && "border-gray-400 bg-gray-100",
                    (disabled || (files.length + existingFiles.length) >= maxFiles) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  <ImagePlus className="w-8 h-8 text-gray-500" />
                  <span className="text-sm text-gray-500 text-center">
                    {isDragActive
                      ? "Drop it here!"
                      : "Drop images here or click to upload"}
                  </span>
                </div>
              )}
            </Dropzone>

            {/* Existing Uploaded Files */}
            {existingFiles.map((file, index) => (
              <div
                key={file.url}
                className="relative aspect-square group"
              >
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-20 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    Cover Image
                  </div>
                )}

                {/* Loading Overlay */}
                {progresses[file.name] !== undefined && progresses[file.name] < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-white ml-2">{Math.round(progresses[file.name])}%</span>
                  </div>
                )}

                <button
                  onClick={() => removeExistingFile(file)}
                  className="z-10 absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg
                             opacity-0 group-hover:opacity-100 transition-opacity
                             hover:bg-red-50"
                  type="button"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}

            {/* Sortable Uploaded Files */}
            {files.map((file, index) => (
              <SortableImage
                key={file.id}
                file={file}
                onRemove={removeFile}
                isCoverImage={index === 0 && existingFiles.length === 0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex items-center gap-4">
          <Button onClick={handleUpload} disabled={disabled}>
            Upload {files.length} {files.length === 1 ? "file" : "files"}
          </Button>
          <p className="text-sm text-gray-500">
            Drag and drop to reorder images
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;