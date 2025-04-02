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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Media, MediaQueryParams, MediaType } from '@/common/types/media';
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

interface MediaGalleryProps {
    initialFilters?: MediaQueryParams;
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
    const [filters, setFilters] = useState<MediaQueryParams>(initialFilters);
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
    const media = mediaResponse?.data || [];
    const pagination = mediaResponse?.meta || {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    };

    const handleFilterChange = (newFilters: MediaQueryParams) => {
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
                if (media.length === 1 && pagination.page > 1) {
                    setFilters({ ...filters, page: pagination.page - 1 });
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

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        const currentPage = pagination.page;
        const totalPages = pagination.totalPages;

        // Create array of page numbers to display
        let pageNumbers = [];

        // Always show first page, last page, current page, and one page before and after current
        if (totalPages <= 7) {
            // If 7 or fewer pages, show all
            pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // Always include first and last page
            pageNumbers.push(1);

            // Add ellipsis if needed before current page area
            if (currentPage > 3) {
                pageNumbers.push(-1); // -1 represents ellipsis
            }

            // Add pages around current page
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            // Add ellipsis if needed after current page area
            if (currentPage < totalPages - 2) {
                pageNumbers.push(-1); // -1 represents ellipsis
            }

            // Add last page
            pageNumbers.push(totalPages);
        }

        return (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1 || isLoading || isFetching}
                        />
                    </PaginationItem>

                    {pageNumbers.map((page, index) =>
                        page === -1 ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={page === currentPage}
                                    onClick={() => handlePageChange(page)}
                                    disabled={isLoading || isFetching}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    )}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || isLoading || isFetching}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading media...</p>
                </div>
            );
        }

        if (media.length === 0) {
            return (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">📁</div>
                    <h3 className="text-xl font-medium mb-2">No media found</h3>
                    <p className="text-gray-500 mb-6">
                        {Object.keys(filters).length > 2
                            ? "Try adjusting your filters or"
                            : "Get started by"}
                        {" "}uploading your first media file.
                    </p>
                    <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Media
                    </Button>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                            "flex items-center border rounded-lg p-3 transition-colors",
                            selectable && isItemSelected(item)
                                ? "bg-primary/5 border-primary"
                                : "hover:bg-gray-50"
                        )}
                    >
                        {selectable && (
                            <div
                                className={cn(
                                    "flex-shrink-0 w-6 h-6 mr-3 rounded-full border flex items-center justify-center",
                                    isItemSelected(item)
                                        ? "bg-primary border-primary text-white"
                                        : "border-gray-300"
                                )}
                                onClick={() => handleSelectItem(item)}
                            >
                                {isItemSelected(item) && <Check className="h-3 w-3" />}
                            </div>
                        )}

                        <div className="h-12 w-12 mr-4 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            {item.type === MediaType.IMAGE ? (
                                <img
                                    src={item.thumbnailUrl || item.url}
                                    alt={item.alt || item.filename}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    {item.type === MediaType.VIDEO && '🎬'}
                                    {item.type === MediaType.AUDIO && '🎵'}
                                    {item.type === MediaType.DOCUMENT && '📄'}
                                    {item.type === MediaType.OTHER && '📁'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" title={item.filename}>
                                {item.filename}
                            </p>
                            <p className="text-sm text-gray-500">
                                {item.type} • {new Intl.DateTimeFormat().format(new Date(item.createdAt))}
                            </p>
                        </div>

                        {selectable ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openMediaDetails(item)}
                            >
                                Preview
                            </Button>
                        ) : (
                            <div className="flex space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openMediaDetails(item)}
                                >
                                    View
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedMedia(item);
                                        setIsDetailsModalOpen(true);
                                        setIsEditing(true);
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => {
                                        setMediaToDelete(item);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                >
                                    Delete
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
                        <h2 className="text-xl font-semibold">Select Media</h2>
                        <p className="text-sm text-gray-500">
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
                        <div className="bg-gray-100 rounded-md p-1 flex">
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
                <h1 className="text-2xl font-bold">Media Library</h1>
                <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 rounded-md p-1 flex">
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
                    <div className="w-full h-1 bg-gray-100 overflow-hidden">
                        <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                )}

                {renderContent()}

                {media.length > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} items
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