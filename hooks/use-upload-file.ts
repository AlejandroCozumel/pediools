import { useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

interface UploadedFile {
  url: string;
  name: string;
  fullFileName?: string;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useUploadFile() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFiles(files: File[]) {
    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        let progress = 0;
        const interval = setInterval(() => {
          if (progress < 100) {
            progress += 10;
            setProgresses((prev) => ({ ...prev, [file.name]: progress }));
          } else {
            clearInterval(interval);
          }
        }, 100);

        const base64File = await readFileAsDataURL(file);
        const base64Content = base64File.split(",")[1];

        const response = await axios.post("/api/upload", {
          base64Content,
          fileName: file.name,
          fileType: file.type,
        });

        clearInterval(interval);
        setProgresses((prev) => ({ ...prev, [file.name]: 100 }));

        // Create full URL for the file
        const fullUrl = `https://pedimath-hipaa-bucket.s3.us-east-2.amazonaws.com/${response.data.key}`;
        return {
          url: fullUrl, // Use full URL here
          name: file.name,
          key: response.data.key,
        };
      });

      const newUploadedFiles = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      return newUploadedFiles;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteUploadedFile(fileUrl: string) {
    try {
      const fileName = fileUrl.split("/").pop();

      await axios.delete("/api/upload", {
        data: { key: fileUrl },
      });

      setUploadedFiles((prev) => prev.filter((file) => file.url !== fileUrl));

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
      throw error;
    }
  }

  return {
    uploadFiles,
    uploadedFiles,
    progresses,
    isUploading,
    deleteUploadedFile,
  };
}
