// components/media/media-gallery.tsx
import React, { useState } from 'react';
import { Grid, List, Plus, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// Removed pagination components as we're using a simpler UI now
import { toast } from 'sonner';
import {
    useGetMediaQuery,
    useDeleteMediaMutation,
    useUpdateMediaMutation
} from '@/store/features/media';
import MediaCard from './media-card';
import SelectableMediaCard from './selectable-media-card';
import MediaFilters from './media-filters';
import MediaUploadModal from './media-upload';
import MediaDetailsModal from './Media-details-modal';
import { cn } from '@/lib/utils';
import { deleteFileFromFirebase } from '@/services/media';
import { MediaQueryParamsDto, MediaType } from '@/common/dtos';
import { Media } from '@/common/types';

interface MediaGalleryProps {
    initialFilters?: MediaQueryParamsDto;
    selectable?: boolean;
    mode?: 'single' | 'multiple';
    selectedMedia?: Media[];
    onSelect?: (media: Media[]) => void;
    onClose?: () => void;
    limit?: number;
    className?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
    initialFilters = { page: 1, limit: 20, sortBy: 'createdAt', order: 'DESC' },
    selectable = false,
    mode = 'single',
    selectedMedia = [],
    onSelect,
    onClose,
    limit,
    className,
}) => {
    const [filters, setFilters] = useState<MediaQueryParamsDto>(initialFilters);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Media[]>(selectedMedia || []);
    const [selectedMedia2, setSelectedMedia] = useState<Media | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFirebaseDeleteError, setIsFirebaseDeleteError] = useState(false);

    // RTK Query hooks
    const {
        data: mediaResponse,
        isLoading,
        isFetching,
        refetch
    } = useGetMediaQuery(filters);

    const [deleteMedia, { isLoading: isDeleting }] = useDeleteMediaMutation();
    const [updateMedia] = useUpdateMediaMutation();

    // Derived state from RTK Query results
    const media = mediaResponse?.items || [];
    const pagination = mediaResponse?.meta || {
        totalItems: 0,
        itemsPerPage: 10,
        totalPages: 0,
        currentPage: 1
    }

    const handleFilterChange = (newFilters: MediaQueryParamsDto) => {
        setFilters({ ...filters, ...newFilters });
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
    };

    const handleMediaUpload = (uploadedMedia: Media) => {
        // No need to manually update the state - RTK Query will handle cache invalidation
        toast.success('Upload successful', {
            description: 'Media has been uploaded successfully.',
        });
        // Refresh data
        refetch();

        // If in selectable mode with single selection, auto-select the uploaded media
        if (selectable && mode === 'single' && onSelect) {
            handleSelectItem(uploadedMedia);
        }
    };

    const handleMediaUpdate = async (updatedMedia: Media) => {
        try {
            await updateMedia({
                id: updatedMedia.id,
                data: {
                    filename: updatedMedia.filename,
                    alt: updatedMedia.alt,
                    isPublic: updatedMedia.isPublic,
                    tags: updatedMedia.tags,
                }
            }).unwrap();

            setSelectedMedia(updatedMedia);
            toast.success('Media updated', {
                description: `${updatedMedia.filename} has been updated successfully.`,
            });
        } catch (error) {
            console.log('Update failed', error);
            toast.error('Update failed', {
                description: 'There was an error updating the media.',
            });
        }
    };

    // Extract file path from URL
    const getFirebasePathFromUrl = (url: string): string | null => {
        try {
            // For standard Firebase Storage URLs
            const urlObj = new URL(url);

            // Extract the path after /o/ and before the query parameters
            if (urlObj.pathname.includes('/o/')) {
                const path = urlObj.pathname.split('/o/')[1];
                // URL decoding to handle special characters in the path
                return decodeURIComponent(path);
            }

            // If no standard path found, try to extract based on common Firebase URL patterns
            // This is a fallback that might need adjustment based on your exact URL format
            const match = url.match(/firebase.*\.com\/.*\/([^?]+)/);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }

            return null;
        } catch (error) {
            console.error('Error parsing Firebase URL:', error);
            return null;
        }
    };

    const handleMediaDelete = async () => {
        if (!mediaToDelete) return;

        setIsFirebaseDeleteError(false);

        try {
            // Step 1: Try to delete the file from Firebase Storage first
            let firebaseDeleteSuccess = true;

            // Main file
            const filePath = getFirebasePathFromUrl(mediaToDelete.url);
            if (filePath) {
                try {
                    await deleteFileFromFirebase(filePath);
                } catch (firebaseError) {
                    console.error('Error deleting file from Firebase:', firebaseError);
                    firebaseDeleteSuccess = false;
                    setIsFirebaseDeleteError(true);
                }
            }

            // Thumbnail if exists
            if (mediaToDelete.thumbnailUrl) {
                const thumbnailPath = getFirebasePathFromUrl(mediaToDelete.thumbnailUrl);
                if (thumbnailPath) {
                    try {
                        await deleteFileFromFirebase(thumbnailPath);
                    } catch (firebaseError) {
                        console.error('Error deleting thumbnail from Firebase:', firebaseError);
                        // We continue even if thumbnail deletion fails
                    }
                }
            }

            // Step 2: Delete the media record from the database if:
            // - Firebase deletion was successful, or
            // - User confirmed to proceed despite Firebase deletion failure
            if (firebaseDeleteSuccess || isFirebaseDeleteError) {
                await deleteMedia(mediaToDelete.id).unwrap();

                setMediaToDelete(null);
                setIsDeleteDialogOpen(false);
                setIsFirebaseDeleteError(false);

                toast.success('Media deleted', {
                    description: `${mediaToDelete.filename} has been deleted successfully.`,
                });

                // If we just deleted the last item on a page, go to the previous page
                if (media.length === 1 && pagination.totalPages > 1) {
                    setFilters({ ...filters, page: pagination.totalPages - 1 });
                }
            }
        } catch (error) {
            console.log('Deletion failed', error);
            toast.error('Deletion failed', {
                description: 'There was an error deleting the media file.',
            });
        }
    };

    const openMediaDetails = (media: Media) => {
        setSelectedMedia(media);
        setIsDetailsModalOpen(true);
        setIsEditing(false);
    };

    // For selectable mode
    const handleSelectItem = (media: Media) => {
        if (!selectable || !onSelect) return;

        if (mode === 'single') {
            setSelectedItems([media]);
            onSelect([media]);
        } else {
            // Multiple selection mode
            if (selectedItems.some(item => item.id === media.id)) {
                // Deselect if already selected
                const updatedSelection = selectedItems.filter(item => item.id !== media.id);
                setSelectedItems(updatedSelection);
                onSelect(updatedSelection);
            } else {
                // Check if limit reached
                if (limit && selectedItems.length >= limit) {
                    toast.error('Selection limit reached', {
                        description: `You can select a maximum of ${limit} media items.`
                    });
                    return;
                }

                // Add to selection
                const updatedSelection = [...selectedItems, media];
                setSelectedItems(updatedSelection);
                onSelect(updatedSelection);
            }
        }
    };

    const isItemSelected = (mediaItem: Media): boolean => {
        return selectedItems.some(item => item.id === mediaItem.id);
    };

    const handleClearSelection = () => {
        if (!selectable || !onSelect) return;

        setSelectedItems([]);
        onSelect([]);
    };

    const handlePreviousPage = () => {
        if (pagination.currentPage > 1) {
            handlePageChange(pagination.currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.currentPage < pagination.totalPages) {
            handlePageChange(pagination.currentPage + 1);
        }
    };

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        const currentPage = pagination.currentPage;
        const totalPages = pagination.totalPages;

        return (
            <div className="space-x-2 flex items-center">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1 || isLoading || isFetching}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || isLoading || isFetching}
                >
                    Next
                </Button>
            </div>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center rounded-md border border-muted p-4 mb-4 bg-card">
                        <div className="h-10 w-10 border-[3px] border-primary/30 border-t-primary rounded-full mx-auto"></div>
                    </div>
                    <p className="text-muted-foreground">Loading media files...</p>
                </div>
            );
        }

        if (media.length === 0) {
            return (
                <div className="text-center py-16 px-4 max-w-md mx-auto">
                    <div className="mb-6 bg-muted/50 inline-block p-6 rounded-full">
                        <div className="relative w-16 h-16">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground h-16 w-16">
                                <path d="M20 20a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z" />
                                <path d="M14 20H2a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2" />
                                <path d="M13.9 7.58a2 2 0 1 0-2.8-2.85" />
                                <path d="M13.1 6.58a2 2 0 1 0 2.8-2.85" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-medium mb-3 text-foreground">No media found</h3>
                    <p className="text-muted-foreground mb-6">
                        {Object.keys(filters).length > 2
                            ? "Try adjusting your filters or upload a new media file."
                            : "Upload images, videos, audio files, and documents to your media library."}
                    </p>
                    <Button onClick={() => setIsUploadModalOpen(true)} size="lg" className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Media
                    </Button>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    {media.map((item) => (
                        selectable ? (
                            <SelectableMediaCard
                                key={item.id}
                                media={item}
                                selected={isItemSelected(item)}
                                onSelect={() => handleSelectItem(item)}
                                onPreview={() => openMediaDetails(item)}
                                selectionMode={mode}
                            />
                        ) : (
                            <MediaCard
                                key={item.id}
                                media={item}
                                onView={() => openMediaDetails(item)}
                                onEdit={() => {
                                    setSelectedMedia(item);
                                    setIsDetailsModalOpen(true);
                                    setIsEditing(true);
                                }}
                                onDelete={() => {
                                    setMediaToDelete(item);
                                    setIsDeleteDialogOpen(true);
                                }}
                            />
                        )
                    ))}
                </div>
            );
        }

        // List view
        return (
            <div className="space-y-2">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "flex items-center border rounded-lg p-4 transition-all duration-200",
                            "hover:shadow-sm hover:bg-muted/30",
                            selectable && isItemSelected(item)
                                ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                                : "hover:border-muted-foreground/20"
                        )}
                    >
                        {/* Selection indicator */}
                        {selectable && (
                            <div
                                className={cn(
                                    "flex-shrink-0 w-6 h-6 mr-3 rounded-full border shadow-sm flex items-center justify-center transition-all cursor-pointer",
                                    isItemSelected(item)
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "bg-background border-muted-foreground/30"
                                )}
                                onClick={() => handleSelectItem(item)}
                            >
                                {isItemSelected(item) && <Check className="h-3 w-3" />}
                            </div>
                        )}

                        {/* Media thumbnail with improved styling */}
                        <div className="h-20 w-20 mr-5 flex-shrink-0 bg-muted/50 rounded-md overflow-hidden border border-muted shadow-sm">
                            {item.type === MediaType.IMAGE ? (
                                <img
                                    src={item.thumbnailUrl || item.url}
                                    alt={item.alt || item.filename}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-background/50">
                                    {item.type === MediaType.VIDEO && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground h-6 w-6">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    )}
                                    {item.type === MediaType.AUDIO && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground h-6 w-6">
                                            <path d="M9 18V5l12-2v13" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                        </svg>
                                    )}
                                    {item.type === MediaType.DOCUMENT && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground h-6 w-6">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    )}
                                    {item.type === MediaType.OTHER && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground h-6 w-6">
                                            <path d="M18 3v4c0 2-2 4-4 4H2" />
                                            <path d="M18 3a2 2 0 1 1 4 0v14a2 2 0 1 1-4 0V3z" />
                                            <path d="M2 7v10c0 2 2 4 4 4h8" />
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Media information with improved typography */}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground mb-1" title={item.filename}>
                                {item.filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    item.type === MediaType.IMAGE && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                    item.type === MediaType.VIDEO && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                                    item.type === MediaType.AUDIO && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                    item.type === MediaType.DOCUMENT && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                    item.type === MediaType.OTHER && "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                                )}>
                                    {item.type}
                                </span>
                                <span className="text-muted-foreground flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    {new Intl.DateTimeFormat().format(new Date(item.createdAt))}
                                </span>
                                {item.isPublic ? (
                                    <span className="text-muted-foreground flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                                            <circle cx="12" cy="12" r="10" />
                                            <circle cx="12" cy="12" r="4" />
                                        </svg>
                                        Public
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        Private
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action buttons with improved styling */}
                        {selectable ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openMediaDetails(item)}
                                className="flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                Preview
                            </Button>
                        ) : (
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openMediaDetails(item)}
                                    className="flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedMedia(item);
                                        setIsDetailsModalOpen(true);
                                        setIsEditing(true);
                                    }}
                                    className="flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        <path d="m15 5 4 4" />
                                    </svg>
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => {
                                        setMediaToDelete(item);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Build header based on mode (selectable or normal)
    const renderHeader = () => {
        if (selectable) {
            return (
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Select Media</h2>
                        <p className="text-sm text-muted-foreground">
                            {mode === 'single'
                                ? 'Select one media file'
                                : limit
                                    ? `Select up to ${limit} media files`
                                    : 'Select multiple media files'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Selection counter and clear button */}
                        {selectedItems.length > 0 && (
                            <div className="text-sm bg-primary/10 text-primary rounded-full px-3 py-1 flex items-center gap-1">
                                <span>{selectedItems.length} selected</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={handleClearSelection}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {/* View mode toggle */}
                        <div className="bg-muted rounded-md p-1 flex">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Upload button */}
                        <Button onClick={() => setIsUploadModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Upload
                        </Button>
                    </div>
                </div>
            );
        }

        // Default non-selectable header
        return (
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
                <div className="flex items-center space-x-2">
                    <div className="bg-muted rounded-md p-1 flex">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Media
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className={cn("space-y-6", className)}>
            {renderHeader()}

            <MediaFilters filters={filters} onFilterChange={handleFilterChange} />

            <div>
                {isFetching && !isLoading && (
                    <div className="w-full h-1 bg-muted overflow-hidden">
                        <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                )}

                {renderContent()}

                {media.length > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                            {pagination.totalItems} items
                        </div>
                        {renderPagination()}
                    </div>
                )}
            </div>

            {/* Footer with actions for selectable mode */}
            {selectable && onClose && (
                <div className="border-t pt-4 flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSelect && onSelect(selectedItems)}
                        disabled={mode === 'single' && selectedItems.length === 0}
                    >
                        {mode === 'single' ? 'Select Media' : `Select ${selectedItems.length} Items`}
                    </Button>
                </div>
            )}

            {/* Upload Modal */}
            <MediaUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={handleMediaUpload}
            />

            {/* Details/Edit Modal */}
            {selectedMedia2 && (
                <MediaDetailsModal
                    media={selectedMedia2}
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedMedia(null);
                        setIsEditing(false);
                    }}
                    onSave={handleMediaUpdate}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                />
            )}

            {/* Delete confirmation dialog */}
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setIsFirebaseDeleteError(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Media
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isFirebaseDeleteError ? (
                                <>
                                    <p className="text-red-500 font-semibold mb-2">
                                        Unable to delete file from Firebase Storage.
                                    </p>
                                    <p>
                                        The file in storage may be missing or inaccessible. Do you still want to remove the database record?
                                    </p>
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete <strong>{mediaToDelete?.filename}</strong>?
                                    This action cannot be undone and will permanently remove the file from both the database and storage.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setMediaToDelete(null);
                                setIsFirebaseDeleteError(false);
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleMediaDelete}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isFirebaseDeleteError ? 'Delete Database Record Only' : 'Delete'}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MediaGallery;