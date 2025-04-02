// components/media/selectable-media-card.tsx
import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileIcon, Music, FileText, Film, Check } from 'lucide-react';
import { Media, MediaType } from '@/common/types/media';
import { formatFileSize, formatDate } from '@/utils/media';
import { cn } from '@/lib/utils';

interface SelectableMediaCardProps {
    media: Media;
    selected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    selectionMode: 'single' | 'multiple';
    className?: string;
}

const SelectableMediaCard: React.FC<SelectableMediaCardProps> = ({
    media,
    selected,
    onSelect,
    onPreview,
    className,
}) => {
    const getMediaPreview = () => {
        if (media.type === MediaType.IMAGE) {
            return (
                <div className="relative w-full h-40 bg-gray-100 rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image
                        src={media.url}
                        alt={media.alt || media.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                    />
                </div>
            );
        }

        if (media.type === MediaType.VIDEO) {
            return (
                <div className="relative w-full h-40 bg-gray-100 rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {media.thumbnailUrl ? (
                        <Image
                            src={media.thumbnailUrl}
                            alt={media.alt || media.filename}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 300px"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
                            <Film className="h-12 w-12 text-purple-400" />
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 z-20">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                            {media.duration && media.duration > 0 ?
                                `${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}`
                                : 'Video'}
                        </Badge>
                    </div>
                </div>
            );
        }

        // Icon-based previews with gradients for other types
        const iconMap = {
            [MediaType.AUDIO]: <Music className="h-12 w-12 text-amber-400" />,
            [MediaType.DOCUMENT]: <FileText className="h-12 w-12 text-blue-400" />,
            [MediaType.OTHER]: <FileIcon className="h-12 w-12 text-gray-400" />,
        };

        const gradientMap = {
            [MediaType.AUDIO]: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30",
            [MediaType.DOCUMENT]: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
            [MediaType.OTHER]: "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-700",
        };

        return (
            <div className={`flex items-center justify-center w-full h-40 rounded-t-md ${gradientMap[media.type] || gradientMap[MediaType.OTHER]} group-hover:opacity-90 transition-opacity`}>
                {iconMap[media.type] || iconMap[MediaType.OTHER]}
            </div>
        );
    };

    return (
        <Card
            className={cn(
                "overflow-hidden group transition-all duration-200 relative py-0",
                selected ? "ring-2 ring-primary ring-offset-2" : "hover:shadow-md",
                className
            )}
            onClick={onSelect}
        >
            {/* Selection indicator */}
            <div className={cn(
                "absolute top-2 left-2 z-20 w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                selected
                    ? "bg-primary border-primary text-white"
                    : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
            )}>
                {selected && <Check className="h-3 w-3" />}
            </div>

            {getMediaPreview()}

            <CardContent className="p-3">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate" title={media.filename}>
                            {media.filename}
                        </h3>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {formatFileSize(media.size)} • {formatDate(media.createdAt)}
                    </div>

                    {/* Preview button appears on hover */}
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview();
                            }}
                        >
                            <Eye className="h-3 w-3 mr-1" /> Preview
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SelectableMediaCard;