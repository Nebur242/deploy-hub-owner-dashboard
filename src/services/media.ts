import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { MediaType } from "@/common/types/media";
import { storage } from "@/config/firebase";

// Generate thumbnail URL (this is a placeholder - you might want to implement actual thumbnail generation)
export const generateThumbnail = async (
  file: File,
  type: MediaType
): Promise<string | undefined> => {
  if (type === MediaType.IMAGE) {
    // For images, you might return the same URL or generate a smaller version
    return undefined; // In this case, we'll use the original image
  }

  if (type === MediaType.VIDEO) {
    // For videos, you might want to generate a thumbnail from the first frame
    return "/assets/video-thumbnail.png"; // Placeholder
  }

  // Default thumbnails for other types
  const thumbnails = {
    [MediaType.AUDIO]: "/assets/audio-thumbnail.png",
    [MediaType.DOCUMENT]: "/assets/document-thumbnail.png",
    [MediaType.OTHER]: "/assets/file-thumbnail.png",
  };

  return thumbnails[type as keyof typeof thumbnails];
};

// Utility function to extract image dimensions
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
};

// Utility function to extract video/audio duration
export const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const media = file.type.startsWith("video/")
      ? document.createElement("video")
      : document.createElement("audio");
    media.onloadedmetadata = () => {
      resolve(media.duration);
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
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    console.log(`Successfully deleted file: ${path}`);
  } catch (error) {
    console.error(`Error deleting file from Firebase Storage: ${path}`, error);
    throw error;
  }
};

// Other existing Firebase utility functions...
export const uploadFileToFirebase = (
  file: File,
  path = "media",
  onProgress?: (progress: number) => void,
  onError?: (error: Error) => void
) => {
  return new Promise<{ url: string; path: string }>((resolve, reject) => {
    try {
      const uniqueFilename = generateUniqueFilename(file);
      const storagePath = `${path}/${uniqueFilename}`;
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
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
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
