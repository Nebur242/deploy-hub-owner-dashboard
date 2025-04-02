import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { MediaType } from "@/common/types/media";
import { storage } from "@/config/firebase";
import { v4 as uuidv4 } from "uuid";

// Generate thumbnail URL (this is a placeholder - you might want to implement actual thumbnail generation)
export const generateThumbnail = (file: File, type: MediaType) => {
  if (type === MediaType.IMAGE) {
    // For images, you might return the same URL or generate a smaller version
    return URL.createObjectURL(file); // In this case, we'll use the original image
  }

  if (type === MediaType.VIDEO) {
    // For videos, you might want to generate a thumbnail from the first frame
    return "/assets/video-thumbnail.png"; // Placeholder
  }

  // Default thumbnails for other types
  const thumbnails = {
    [MediaType.AUDIO]: "/assets/audio-thumbnail.png",
    [MediaType.DOCUMENT]: "/assets/document-thumbnail.png",
    [MediaType.OTHER]: "/assets/document-thumbnail.png",
  };

  return thumbnails[type as keyof typeof thumbnails];
};

// Utility function to extract image dimensions
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for dimension extraction"));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Utility function to extract video/audio duration
export const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const media = file.type.startsWith("video/")
      ? document.createElement("video")
      : document.createElement("audio");
    media.onloadedmetadata = () => {
      resolve(media.duration);
    };
    media.onerror = () => {
      reject(new Error("Failed to load media for duration extraction"));
    };
    media.src = URL.createObjectURL(file);
  });
};

/**
 * Delete a file from Firebase Storage
 * @param path - The storage path to the file
 */
export const deleteFileFromFirebase = async (path: string): Promise<void> => {
  try {
    const sanitizedPath = path.replace(/\.\.\//g, "").replace(/\\/g, "/");
    const fileRef = ref(storage, sanitizedPath);
    await deleteObject(fileRef);
    console.log(`Successfully deleted file: ${sanitizedPath}`);
  } catch (error) {
    console.error(`Error deleting file from Firebase Storage: ${path}`, error);
    throw error;
  }
};

/**
  * Upload a file to Firebase Storage
  * @param file - The file to upload
  * @param path - The storage path (default: "media")
  * @param onProgress - Optional callback for upload progress
  * @param onError - Optional callback for upload errors
  * @returns Promise resolving to the download URL and storage path
+  */
export const uploadFileToFirebase = (
  file: File,
  path = "media",
  onProgress?: (progress: number) => void,
  onError?: (error: Error) => void
) => {
  return new Promise<{ url: string; path: string }>((resolve, reject) => {
    try {
      const uniqueFilename = generateUniqueFilename(file);
      const sanitizedPath = path.replace(/\.\.\//g, "").replace(/\\/g, "/");
      const storagePath = `${sanitizedPath}/${uniqueFilename}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          if (onError) onError(error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, path: storagePath });
        }
      );
    } catch (error) {
      if (onError && error instanceof Error) onError(error);
      reject(error);
    }
  });
};

// Helper functions
export const generateUniqueFilename = (file: File) => {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  return `${timestamp}-${uuidv4()}.${extension}`;
};

export const getMediaTypeFromMimeType = (mimeType: string): MediaType => {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  if (mimeType.startsWith("audio/")) return MediaType.AUDIO;
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )
    return MediaType.DOCUMENT;
  return MediaType.OTHER;
};
