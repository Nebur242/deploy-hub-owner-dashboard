// components/media/selectable-media-card.tsx
import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Eye,
    FileIcon,
    Music,
    FileText,
    Film,
    Check,
    Calendar,
    HardDrive
} from 'lucide-react';
import { formatFileSize, formatDate } from '@/utils/media';
import { cn } from '@/lib/utils';
import { Media } from '@/common/types';
import { MediaType } from '@/common/dtos';

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
                <div className="relative w-full aspect-video bg-muted rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image
                        src={media.url}
                        alt={media.alt || media.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 z-20">
                        <Badge variant="outline" className="bg-background/80 text-foreground backdrop-blur-sm border shadow-sm">
                            Image
                        </Badge>
                    </div>
                </div>
            );
        }

        if (media.type === MediaType.VIDEO) {
            return (
                <div className="relative w-full aspect-square bg-muted rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {media.thumbnailUrl ? (
                        <Image
                            src={media.thumbnailUrl}
                            alt={media.alt || media.filename}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                            <Film className="h-20 w-20 text-purple-400 dark:text-purple-500 opacity-80" />
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 z-20">
                        <Badge variant="secondary" className="bg-black/80 text-white backdrop-blur-sm">
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
            [MediaType.AUDIO]: <Music className="h-20 w-20 text-amber-400 dark:text-amber-500 opacity-80" />,
            [MediaType.DOCUMENT]: <FileText className="h-20 w-20 text-blue-400 dark:text-blue-500 opacity-80" />,
            [MediaType.OTHER]: <FileIcon className="h-20 w-20 text-muted-foreground opacity-80" />,
        };

        const gradientMap = {
            [MediaType.AUDIO]: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
            [MediaType.DOCUMENT]: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
            [MediaType.OTHER]: "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/50",
        };

        const labelMap = {
            [MediaType.AUDIO]: "Audio",
            [MediaType.DOCUMENT]: "Document",
            [MediaType.OTHER]: "File"
        };

        return (
            <div className={cn(
                "flex items-center justify-center w-full aspect-square rounded-t-md group-hover:opacity-90 transition-opacity relative",
                gradientMap[media.type] || gradientMap[MediaType.OTHER]
            )}>
                {iconMap[media.type] || iconMap[MediaType.OTHER]}
                <div className="absolute bottom-2 right-2 z-20">
                    <Badge variant="outline" className="bg-background/80 text-foreground backdrop-blur-sm border shadow-sm">
                        {labelMap[media.type] || "File"}
                    </Badge>
                </div>
            </div>
        );
    };

    return (
        <Card
            className={cn(
                "overflow-hidden group transition-all duration-200 relative py-0",
                "hover:shadow-md hover:scale-[1.02] gap-2",
                selected
                    ? "ring-2 ring-primary ring-offset-1 bg-primary/5"
                    : "hover:bg-muted/5",
                className
            )}
            onClick={onSelect}
        >
            {/* Selection indicator */}
            <div className={cn(
                "absolute top-2 left-2 z-20 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center transition-all",
                selected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background/90 backdrop-blur-sm border-muted-foreground/30 opacity-0 group-hover:opacity-100"
            )}>
                {selected && <Check className="h-3 w-3" />}
            </div>

            {getMediaPreview()}

            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Filename */}
                    <div>
                        <h3 className="font-medium text-base truncate text-foreground" title={media.filename}>
                            {media.filename}
                        </h3>
                    </div>

                    {/* File details with icons */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1" title="File size">
                            <HardDrive className="h-3 w-3" />
                            <span>{formatFileSize(media.size)}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Upload date">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(media.createdAt)}</span>
                        </div>
                    </div>

                    {/* Preview button appears on hover */}
                    <div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-xs shadow-sm bg-background/90 backdrop-blur-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview();
                            }}
                        >
                            <Eye className="h-4 w-4 mr-1" /> Preview
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SelectableMediaCard;