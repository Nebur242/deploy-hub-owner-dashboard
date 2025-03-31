// components/media/MediaUploader.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, FileText, Image, Video, Music, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Media, MediaType } from '@/common/types/media';
import { formatFileSize } from '@/utils/media';
import {
    uploadFileToFirebase,
    getMediaTypeFromMimeType,
    getImageDimensions,
    getMediaDuration,
    generateThumbnail
} from '@/services/media';
import { useCreateMediaMutation } from '@/store/features/media';

interface MediaUploaderProps {
    onUploadComplete: (media: Media) => void;
    onCancel: () => void;
    maxSize?: number; // Maximum file size in bytes
    allowMultiple?: boolean;
    acceptedFileTypes?: string[];
}

interface FileWithPreview extends File {
    preview?: string;
    id: string;
}

interface UploadingFile {
    file: FileWithPreview;
    progress: number;
    error: string | null;
    type: MediaType;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
    onUploadComplete,
    onCancel,
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowMultiple = false,
    acceptedFileTypes = undefined,
}) => {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [currentUploads, setCurrentUploads] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // RTK Query hook for creating media
    const [createMedia, { isLoading: isCreating }] = useCreateMediaMutation();

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const filesToUpload = acceptedFiles.map((file) => ({
                file: Object.assign(file, {
                    preview: URL.createObjectURL(file),
                    id: Math.random().toString(36).substr(2, 9),
                }),
                progress: 0,
                error: null,
                type: getMediaTypeFromMimeType(file.type),
            }));

            setUploadingFiles((prev) => [...prev, ...filesToUpload]);
        },
        []
    );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        maxSize,
        accept: acceptedFileTypes
            ? acceptedFileTypes.reduce((acc, type) => {
                acc[type] = [];
                return acc;
            }, {} as Record<string, string[]>)
            : undefined,
        multiple: allowMultiple,
    });

    const removeFile = (id: string) => {
        setUploadingFiles((prev) => prev.filter((item) => item.file.id !== id));
    };

    const uploadFile = async (uploadingFile: UploadingFile) => {
        try {
            setIsUploading(true);
            setCurrentUploads((prev) => prev + 1);

            const { file, type } = uploadingFile;

            // Upload to Firebase
            const { url } = await uploadFileToFirebase(
                file,
                `media/${type}`,
                (progress) => {
                    setUploadingFiles((prev) =>
                        prev.map((item) =>
                            item.file.id === file.id ? { ...item, progress } : item
                        )
                    );
                },
                (error) => {
                    setUploadingFiles((prev) =>
                        prev.map((item) =>
                            item.file.id === file.id
                                ? { ...item, error: error.message }
                                : item
                        )
                    );
                }
            );

            // Generate thumbnail if needed
            const thumbnailUrl = await generateThumbnail(file, type);

            // Get additional metadata based on file type
            let width, height, duration;
            if (type === MediaType.IMAGE) {
                const dimensions = await getImageDimensions(file);
                width = dimensions.width;
                height = dimensions.height;
            } else if (type === MediaType.VIDEO || type === MediaType.AUDIO) {
                duration = await getMediaDuration(file);
            }

            // Create media entry in the backend using RTK Query
            const mediaData = {
                filename: file.name,
                originalFilename: file.name,
                mimeType: file.type,
                type,
                size: file.size,
                url,
                thumbnailUrl,
                width,
                height,
                duration: duration || 0,
                alt: file.name,
                metadata: {},
                isPublic: true,
                tags: [],
            };

            const createdMedia = await createMedia(mediaData).unwrap();
            onUploadComplete(createdMedia);

            // Remove from list
            setUploadingFiles((prev) => prev.filter((item) => item.file.id !== file.id));

            // Show success toast
            toast.success("Upload complete", {
                description: `${file.name} has been uploaded successfully.`
            });
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error("Upload failed", {
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });

            if (error instanceof Error) {
                setUploadingFiles((prev) =>
                    prev.map((item) =>
                        item.file.id === uploadingFile.file.id
                            ? { ...item, error: error.message }
                            : item
                    )
                );
            }
        } finally {
            setCurrentUploads((prev) => prev - 1);
            if (currentUploads <= 1) {
                setIsUploading(false);
            }
        }
    };

    const startUploads = async () => {
        if (uploadingFiles.length === 0) return;

        // Upload each file one by one
        for (const file of uploadingFiles) {
            if (!file.error) {
                await uploadFile(file);
            }
        }
    };

    const getFileIcon = (type: MediaType) => {
        switch (type) {
            case MediaType.IMAGE:
                return <Image className="h-8 w-8 text-blue-500" />;
            case MediaType.VIDEO:
                return <Video className="h-8 w-8 text-red-500" />;
            case MediaType.AUDIO:
                return <Music className="h-8 w-8 text-yellow-500" />;
            case MediaType.DOCUMENT:
                return <FileText className="h-8 w-8 text-green-500" />;
            default:
                return <File className="h-8 w-8 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary/50'
                    }`}
            >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-lg font-medium">Drag and drop files here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">
                    Max file size: {formatFileSize(maxSize)}
                    {acceptedFileTypes && acceptedFileTypes.length > 0 && (
                        <> • Accepted formats: {acceptedFileTypes.join(', ')}</>
                    )}
                </p>
            </div>

            {fileRejections.length > 0 && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {fileRejections.map(({ file, errors }: FileRejection) => (
                        <div key={file.name} className="mb-1">
                            <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
                        </div>
                    ))}
                </div>
            )}

            {uploadingFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="text-sm font-medium">Files ({uploadingFiles.length})</div>
                    <ul className="space-y-2">
                        {uploadingFiles.map((item) => (
                            <li
                                key={item.file.id}
                                className="flex items-center p-2 bg-gray-50 rounded-md"
                            >
                                <div className="mr-2">{getFileIcon(item.type)}</div>
                                <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-medium truncate" title={item.file.name}>
                                            {item.file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(item.file.size)}
                                        </p>
                                    </div>
                                    {item.progress > 0 && (
                                        <Progress value={item.progress} className="h-1 mt-1" />
                                    )}
                                    {item.error && (
                                        <p className="text-xs text-red-500 mt-1">{item.error}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isUploading}
                                    onClick={() => removeFile(item.file.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={onCancel} disabled={isUploading || isCreating}>
                    Cancel
                </Button>
                <Button
                    onClick={startUploads}
                    disabled={uploadingFiles.length === 0 || isUploading || isCreating}
                >
                    {isUploading || isCreating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            Upload Files
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default MediaUploader;