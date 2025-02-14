import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUploadFile } from "@/hooks/use-upload-file";

import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { FileUploader } from "@/components/uploader/FileUploader";

const schema = z.object({
  images: z.array(
    z.any().refine((file) => file instanceof File, {
      message: "Invalid file",
    })
  ),
});

type Schema = z.infer<typeof schema>;

interface UploaderProps {
  onUploadedFilesChange: (files: string[]) => void;
  accept: Record<string, string[]>;
}

export default function Uploader({
  onUploadedFilesChange,
  accept,
}: UploaderProps) {
  const {
    uploadFiles,
    progresses,
    uploadedFiles,
    isUploading,
    deleteUploadedFile,
  } = useUploadFile();

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      images: [],
    },
  });

  useEffect(() => {
    const fileUrls = uploadedFiles.map(file => file.url);
    onUploadedFilesChange(fileUrls);
  }, [uploadedFiles, onUploadedFilesChange]);

  return (
    <Form {...form}>
      <form className="grid w-full gap-4">
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FileUploader
                value={field.value}
                onValueChange={field.onChange}
                onUpload={(files: File[]) => uploadFiles(files)}
                accept={accept}
                maxSize={1024 * 1024 * 4}
                maxFiles={1}
                multiple={false}
                progresses={progresses}
                disabled={isUploading}
                deleteUploadedFile={deleteUploadedFile}
              />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
