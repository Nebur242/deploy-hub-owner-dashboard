// components/media/MediaDetailsModal.tsx
import React from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, Edit, Save, Loader2 } from 'lucide-react';
import { Media, MediaType } from '@/common/types/media';
import { formatFileSize, formatDate } from '@/utils/media';
import { useUpdateMediaMutation } from '@/store/features/media';

interface MediaDetailsModalProps {
    media: Media | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (media: Media) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
}

const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
    media,
    isOpen,
    onClose,
    onSave,
    isEditing,
    setIsEditing,
}) => {
    const [formData, setFormData] = React.useState<Partial<Media>>({});
    const [tagInput, setTagInput] = React.useState('');

    // RTK Query update mutation
    const [updateMedia, { isLoading: isUpdating }] = useUpdateMediaMutation();

    React.useEffect(() => {
        if (media) {
            setFormData({
                filename: media.filename,
                alt: media.alt,
                isPublic: media.isPublic,
                tags: [...media.tags],
            });
        }
    }, [media, isEditing]);

    if (!media) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, isPublic: checked }));
    };

    const handleTagAdd = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...(prev.tags || []), tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagAdd();
        }
    };

    const handleTagRemove = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags?.filter((t) => t !== tag),
        }));
    };

    const handleSave = async () => {
        if (!media || !formData) return;

        try {
            const updatedMedia = await updateMedia({
                id: media.id,
                data: formData
            }).unwrap();

            onSave(updatedMedia);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update media:', error);
        }
    };

    const renderPreview = () => {
        if (media.type === MediaType.IMAGE) {
            return (
                <div className="relative w-full h-80 bg-gray-100 rounded overflow-hidden">
                    <Image
                        src={media.url}
                        alt={media.alt || media.filename}
                        fill
                        className="object-contain"
                    />
                </div>
            );
        }

        if (media.type === MediaType.VIDEO) {
            return (
                <div className="w-full h-80 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    <video controls className="max-h-full max-w-full">
                        <source src={media.url} type={media.mimeType} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (media.type === MediaType.AUDIO) {
            return (
                <div className="w-full bg-gray-100 rounded p-4 flex items-center justify-center">
                    <audio controls className="w-full">
                        <source src={media.url} type={media.mimeType} />
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            );
        }

        if (media.type === MediaType.DOCUMENT) {
            return (
                <div className="w-full h-80 bg-gray-100 rounded flex items-center justify-center">
                    <iframe
                        src={media.url}
                        className="w-full h-full"
                        title={media.filename}
                    />
                </div>
            );
        }

        return (
            <div className="w-full h-80 bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-gray-500">Preview not available for this file type</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{isEditing ? 'Edit Media' : 'Media Details'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!isEditing && renderPreview()}

                    <div className="grid gap-4">
                        {isEditing ? (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="filename">Name</Label>
                                    <Input
                                        id="filename"
                                        name="filename"
                                        value={formData.filename || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="alt">Alt Text</Label>
                                    <Textarea
                                        id="alt"
                                        name="alt"
                                        value={formData.alt || ''}
                                        onChange={handleInputChange}
                                        rows={2}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isPublic"
                                        checked={formData.isPublic}
                                        onCheckedChange={handleSwitchChange}
                                    />
                                    <Label htmlFor="isPublic">Public</Label>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Tags</Label>
                                    <div className="flex space-x-2">
                                        <Input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagInputKeyDown}
                                            placeholder="Add tag and press Enter"
                                        />
                                        <Button type="button" onClick={handleTagAdd} variant="outline">
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags?.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTagRemove(tag)}
                                                    className="focus:outline-none"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Filename</h3>
                                        <p>{media.filename}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Original Filename</h3>
                                        <p>{media.originalFilename}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Type</h3>
                                        <p>{media.type}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Size</h3>
                                        <p>{formatFileSize(media.size)}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">MIME Type</h3>
                                        <p>{media.mimeType}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Visibility</h3>
                                        <p>{media.isPublic ? 'Public' : 'Private'}</p>
                                    </div>
                                    {(media.width && media.height) && (
                                        <div>
                                            <h3 className="font-semibold text-sm text-gray-500">Dimensions</h3>
                                            <p>{media.width} × {media.height}</p>
                                        </div>
                                    )}
                                    {media.duration && media.duration > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-sm text-gray-500">Duration</h3>
                                            <p>{Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Uploaded</h3>
                                        <p>{formatDate(media.createdAt)}</p>
                                    </div>
                                    {media.updatedAt !== media.createdAt && (
                                        <div>
                                            <h3 className="font-semibold text-sm text-gray-500">Last Updated</h3>
                                            <p>{formatDate(media.updatedAt)}</p>
                                        </div>
                                    )}
                                </div>

                                {media.alt && (
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-500">Alt Text</h3>
                                        <p>{media.alt}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold text-sm text-gray-500">Tags</h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {media.tags.length > 0 ? (
                                            media.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">No tags</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-sm text-gray-500">URL</h3>
                                    <div className="flex items-center mt-1">
                                        <Input value={media.url} readOnly />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigator.clipboard.writeText(media.url)}
                                            className="ml-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        </Button>
                                        <a
                                            href={media.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="ghost" size="icon" className="ml-1">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isUpdating}>
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex space-x-2">
                                <a
                                    href={media.url}
                                    download={media.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </a>
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                            <DialogClose asChild>
                                <Button variant="ghost">Close</Button>
                            </DialogClose>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MediaDetailsModal;