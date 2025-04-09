import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Pencil,
    Trash,
    Eye,
    FileIcon,
    Music,
    FileText,
    Film,
    Calendar,
    HardDrive
} from 'lucide-react';
// import { Media, MediaType } from '@/common/types/media';
import { formatFileSize, formatDate } from '@/utils/media';
import { cn } from '@/lib/utils';
import { Media } from '@/common/types';
import { MediaType } from '@/common/dtos';

interface MediaCardProps {
    media: Media;
    onView: (media: Media) => void;
    onEdit: (media: Media) => void;
    onDelete: (media: Media) => void;
    className?: string;
}

const MediaCard: React.FC<MediaCardProps> = ({ media, onView, onEdit, onDelete, className }) => {
    const getMediaPreview = () => {
        if (media.type === MediaType.IMAGE) {
            return (
                <div className="relative w-full aspect-video bg-muted rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image
                        src={media.url}
                        alt={media.alt || media.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                    />
                    <div className="absolute top-2 right-2 z-20">
                        <Badge variant={media.isPublic ? "default" : "outline"} className="bg-background/90 text-foreground backdrop-blur-sm border shadow-sm text-xs py-0">
                            {media.isPublic ? "Public" : "Private"}
                        </Badge>
                    </div>
                </div>
            );
        }

        if (media.type === MediaType.VIDEO) {
            return (
                <div className="relative w-full aspect-video bg-muted rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <Film className="h-16 w-16 text-purple-400 dark:text-purple-500 opacity-80" />
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 z-20">
                        <Badge variant="secondary" className="bg-black/80 text-white backdrop-blur-sm text-xs py-0">
                            {media.duration && media.duration > 0 ?
                                `${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}`
                                : 'Video'}
                        </Badge>
                    </div>
                    <div className="absolute top-2 right-2 z-20">
                        <Badge variant={media.isPublic ? "default" : "outline"} className="bg-background/90 text-foreground backdrop-blur-sm border shadow-sm text-xs py-0">
                            {media.isPublic ? "Public" : "Private"}
                        </Badge>
                    </div>
                </div>
            );
        }

        // Icon-based previews with gradients for other types
        const iconMap = {
            [MediaType.AUDIO]: <Music className="h-16 w-16 text-amber-400 dark:text-amber-500 opacity-80" />,
            [MediaType.DOCUMENT]: <FileText className="h-16 w-16 text-blue-400 dark:text-blue-500 opacity-80" />,
            [MediaType.OTHER]: <FileIcon className="h-16 w-16 text-muted-foreground opacity-80" />
        };

        const gradientMap = {
            [MediaType.AUDIO]: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
            [MediaType.DOCUMENT]: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
            [MediaType.OTHER]: "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/50"
        };

        return (
            <div className={cn(
                "flex items-center justify-center w-full aspect-video rounded-t-md group-hover:opacity-90 transition-opacity relative",
                gradientMap[media.type] || gradientMap[MediaType.OTHER]
            )}>
                {iconMap[media.type] || iconMap[MediaType.OTHER]}
                <div className="absolute top-2 right-2">
                    <Badge variant={media.isPublic ? "default" : "outline"} className="bg-background/90 text-foreground backdrop-blur-sm border shadow-sm text-xs py-0">
                        {media.isPublic ? "Public" : "Private"}
                    </Badge>
                </div>
            </div>
        );
    };

    return (
        <Card className={cn(
            "overflow-hidden group py-0 transition-all duration-200",
            "hover:shadow-md hover:scale-[1.02]",
            "focus-within:ring-2 focus-within:ring-primary/50",
            className
        )}>
            {/* Media Preview */}
            {getMediaPreview()}

            {/* Media Info */}
            <CardContent className="p-3 pb-2">
                <div className="space-y-1">
                    {/* Filename */}
                    <h3 className="font-medium truncate text-sm text-foreground" title={media.filename}>
                        {media.filename}
                    </h3>

                    {/* File details with mini-icons inline */}
                    <div className="flex items-center text-xs text-muted-foreground gap-3">
                        <div className="flex items-center gap-1" title="File size">
                            <HardDrive className="h-3 w-3" />
                            <span>{formatFileSize(media.size)}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Upload date">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(media.createdAt)}</span>
                        </div>
                    </div>

                    {/* Tags */}
                    {media.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {media.tags.slice(0, 3).map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4 truncate max-w-[70px]"
                                    title={tag}
                                >
                                    {tag}
                                </Badge>
                            ))}
                            {media.tags.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    +{media.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Action Buttons */}
            <CardFooter className="p-2 pt-0 gap-2 flex justify-between border-t border-muted mt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(media)}
                    className="text-primary hover:text-primary/90 hover:bg-primary/10 h-8 text-xs px-2"
                >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                </Button>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(media)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8"
                        title="Edit"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(media)}
                        className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        title="Delete"
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default MediaCard;