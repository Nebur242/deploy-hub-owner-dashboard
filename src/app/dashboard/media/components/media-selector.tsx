// components/media/media-selector.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ImagePlus, Trash2, Edit } from 'lucide-react';
import { Media } from '@/common/types/media';
import MediaGallery from './media-gallery';
import Image from 'next/image';

interface SingleMediaSelectorProps {
    label: string;
    value?: Media | null;
    onChange: (media: Media | null) => void;
    required?: boolean;
}

export const SingleMediaSelector: React.FC<SingleMediaSelectorProps> = ({
    label,
    value,
    onChange,
    required = false,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSelect = (selected: Media[]) => {
        onChange(selected[0] || null);
        setIsDialogOpen(false);
    };

    const handleClear = () => {
        onChange(null);
    };

    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="flex flex-col gap-2">
                    {value ? (
                        <div className="relative border rounded-md overflow-hidden group">
                            {value.type === 'image' ? (
                                <div className="relative h-40 bg-gray-100">
                                    <Image
                                        src={value.url}
                                        alt={value.alt || value.filename}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-40 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">
                                            {value.type === 'video' && '🎬'}
                                            {value.type === 'audio' && '🎵'}
                                            {value.type === 'document' && '📄'}
                                            {value.type === 'other' && '📁'}
                                        </div>
                                        <div className="text-sm text-gray-500">{value.filename}</div>
                                    </div>
                                </div>
                            )}

                            {/* Hover overlay with actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="secondary">
                                        <Edit className="h-4 w-4 mr-1" /> Change
                                    </Button>
                                </DialogTrigger>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleClear();
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-40 border-dashed flex flex-col gap-2"
                            >
                                <ImagePlus className="h-8 w-8 text-gray-400" />
                                <span>Select {label}</span>
                            </Button>
                        </DialogTrigger>
                    )}
                </div>

                <DialogContent className="max-w-[80vw] w-[80vw] max-h-[90vh]" style={{ maxWidth: '80vw', width: '80vw' }}>
                    <MediaGallery
                        selectable={true}
                        mode="single"
                        selectedMedia={value ? [value] : []}
                        onSelect={handleSelect}
                        onClose={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface MultipleMediaSelectorProps {
    label: string;
    value: Media[];
    onChange: (media: Media[]) => void;
    limit?: number;
    required?: boolean;
}

export const MultipleMediaSelector: React.FC<MultipleMediaSelectorProps> = ({
    label,
    value = [],
    onChange,
    limit,
    required = false,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSelect = (selected: Media[]) => {
        onChange(selected);
        setIsDialogOpen(false);
    };

    const handleRemove = (mediaToRemove: Media) => {
        onChange(value.filter(item => item.id !== mediaToRemove.id));
    };

    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
                {limit && <span className="text-gray-500 text-sm ml-2">(Max {limit})</span>}
            </Label>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {value.map((media) => (
                            <div key={media.id} className="relative border rounded-md overflow-hidden group">
                                {media.type === 'image' ? (
                                    <div className="relative h-32 bg-gray-100">
                                        <Image
                                            src={media.url}
                                            alt={media.alt || media.filename}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-32 flex items-center justify-center bg-gray-100">
                                        <div className="text-center">
                                            <div className="text-3xl mb-1">
                                                {media.type === 'video' && '🎬'}
                                                {media.type === 'audio' && '🎵'}
                                                {media.type === 'document' && '📄'}
                                                {media.type === 'other' && '📁'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate px-2">{media.filename}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Hover overlay with action */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRemove(media)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Add button */}
                        {(!limit || value.length < limit) && (
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-32 border-dashed flex flex-col gap-2"
                                >
                                    <ImagePlus className="h-6 w-6 text-gray-400" />
                                    <span className="text-sm">Add {label}</span>
                                </Button>
                            </DialogTrigger>
                        )}
                    </div>
                </div>

                <DialogContent className="max-w-[80vw] w-[80vw] max-h-[90vh]" style={{ maxWidth: '80vw', width: '80vw' }}>
                    <MediaGallery
                        selectable={true}
                        mode="multiple"
                        selectedMedia={value}
                        onSelect={handleSelect}
                        onClose={() => setIsDialogOpen(false)}
                        limit={limit}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};