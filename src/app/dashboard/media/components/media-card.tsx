import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Eye, FileIcon, Music, FileText, Film } from 'lucide-react';
import { Media, MediaType } from '@/common/types/media';
import { formatFileSize, formatDate } from '@/utils/media';

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
                <div className="relative w-full h-48 bg-gray-100 rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image
                        src={media.url}
                        alt={media.alt || media.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                    />
                    <div className="absolute top-2 right-2 z-20">
                        <Badge variant={media.isPublic ? "default" : "outline"} className="bg-white/80 text-black dark:bg-black/80 dark:text-white">
                            {media.isPublic ? "Public" : "Private"}
                        </Badge>
                    </div>
                </div>
            );
        }

        if (media.type === MediaType.VIDEO) {
            return (
                <div className="relative w-full h-48 bg-gray-100 rounded-t-md overflow-hidden group-hover:opacity-90 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <Film className="h-16 w-16 text-purple-400" />
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 z-20">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                            {media.duration && media.duration > 0 ?
                                `${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}`
                                : 'Video'}
                        </Badge>
                    </div>
                    <div className="absolute top-2 right-2 z-20">
                        <Badge variant={media.isPublic ? "default" : "outline"} className="bg-white/80 text-black dark:bg-black/80 dark:text-white">
                            {media.isPublic ? "Public" : "Private"}
                        </Badge>
                    </div>
                </div>
            );
        }

        // Icon-based previews with gradients for other types
        const iconMap = {
            [MediaType.AUDIO]: <Music className="h-16 w-16 text-amber-400" />,
            [MediaType.DOCUMENT]: <FileText className="h-16 w-16 text-blue-400" />,
            [MediaType.OTHER]: <FileIcon className="h-16 w-16 text-gray-400" />,
        };

        const gradientMap = {
            [MediaType.AUDIO]: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30",
            [MediaType.DOCUMENT]: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
            [MediaType.OTHER]: "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-700",
        };

        return (
            <div className={`flex items-center justify-center w-full h-48 rounded-t-md ${gradientMap[media.type] || gradientMap[MediaType.OTHER]} group-hover:opacity-90 transition-opacity relative`}>
                {iconMap[media.type] || iconMap[MediaType.OTHER]}
                <div className="absolute top-2 right-2">
                    <Badge variant={media.isPublic ? "default" : "outline"} className="bg-white/80 text-black dark:bg-black/80 dark:text-white">
                        {media.isPublic ? "Public" : "Private"}
                    </Badge>
                </div>
            </div>
        );
    };

    return (
        <Card className={`overflow-hidden hover:shadow-md transition-all duration-200 group py-0 ${className}`}>
            {getMediaPreview()}
            <CardContent className="p-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium truncate text-base" title={media.filename}>
                            {media.filename}
                        </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                        {formatFileSize(media.size)} • {formatDate(media.createdAt)}
                    </div>
                    {media.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {media.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0 h-5">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 gap-2 flex justify-between border-t border-gray-100 dark:border-gray-800 mt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(media)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                    <Eye className="h-4 w-4 mr-1.5" /> View
                </Button>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(media)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(media)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default MediaCard;