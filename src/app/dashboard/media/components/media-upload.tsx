// components/media/MediaUploadModal.tsx
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Media } from '@/common/types/media';
import MediaUploader from './media-uploader';

interface MediaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: (media: Media) => void;
}

const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
    isOpen,
    onClose,
    onUploadComplete,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Upload Media</DialogTitle>
                </DialogHeader>
                <MediaUploader
                    onUploadComplete={(media) => {
                        onUploadComplete(media);
                        onClose();
                    }}
                    onCancel={onClose}
                    maxSize={50 * 1024 * 1024} // 50MB
                    allowMultiple={true}
                />
            </DialogContent>
        </Dialog>
    );
};

export default MediaUploadModal;