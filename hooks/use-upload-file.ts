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

        // Store the full file name (including UUID)
        const fullFileName = response.data.url.split('/').pop();

        return {
          url: response.data.url,
          name: file.name,
          fullFileName: fullFileName // Add this
        };
      });

      const newUploadedFiles = await Promise.all(uploadPromises);
      setUploadedFiles((prevUploadedFiles) => [...prevUploadedFiles, ...newUploadedFiles]);

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });
    } catch (err) {
      console.error("Failed to upload files", err);
      toast({
        title: "Error",
        description: "Failed to upload files, try again later",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteUploadedFile(fileUrl: string) {
    try {
      // Find the file with the matching URL
      const fileToDelete = uploadedFiles.find(file => file.url === fileUrl);

      if (!fileToDelete) {
        throw new Error("File not found");
      }

      // Decode the URL and extract the full file name
      const decodedUrl = decodeURIComponent(fileUrl);
      const fileName = decodedUrl.split('/').pop();

      await axios.delete("/api/upload", {
        data: {
          fileName: fileName,
          originalFileName: fileToDelete.name
        }
      });

      setUploadedFiles((prevUploadedFiles) =>
        prevUploadedFiles.filter((file) => file.url !== fileUrl)
      );

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (err) {
      console.error("Failed to delete file", err);
      toast({
        title: "Error",
        description: "Failed to delete file, try again later",
        variant: "destructive",
      });
    }
  }

  return {
    uploadedFiles,
    progresses,
    uploadFiles,
    isUploading,
    deleteUploadedFile,
  };
}