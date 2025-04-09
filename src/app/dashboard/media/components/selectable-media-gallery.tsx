import React, { useState, useEffect } from 'react';
import { Grid, List, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Media, MediaQueryParams } from '@/common/types/media';
import { useGetMediaQuery } from '@/store/features/media';
import MediaFilters from './media-filters';
import MediaUploadModal from './media-upload';
import MediaDetailsModal from './Media-details-modal';
import SelectableMediaCard from './selectable-media-card';
import { cn } from '@/lib/utils';

interface SelectableMediaGalleryProps {
    initialFilters?: MediaQueryParams;
    mode: 'single' | 'multiple';
    selectedMedia?: Media[];
    onSelect: (media: Media[]) => void;
    onClose?: () => void;
    onUpload?: (media: Media) => void;
    limit?: number;
    className?: string;
}

const SelectableMediaGallery: React.FC<SelectableMediaGalleryProps> = ({
    initialFilters = { page: 1, limit: 20, sortBy: 'createdAt', order: 'DESC' },
    mode = 'single',
    selectedMedia = [],
    onSelect,
    onClose,
    onUpload,
    limit,
    className,
}) => {
    const [filters, setFilters] = useState<MediaQueryParams>(initialFilters);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selected, setSelected] = useState<Media[]>(selectedMedia || []);
    const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // RTK Query hooks
    const {
        data: mediaResponse,
        isLoading,
        isFetching,
        refetch
    } = useGetMediaQuery(filters);

    // Update selected state when prop changes
    useEffect(() => {
        if (selectedMedia) {
            setSelected(selectedMedia);
        }
    }, [selectedMedia]);

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

    const handleMediaUpload = (media: Media) => {
        refetch();

        if (onUpload) {
            onUpload(media);
        }

        // If in single mode, auto-select the uploaded media
        if (mode === 'single') {
            handleSelect(media);
        }

        toast.success('Upload successful', {
            description: 'Media has been uploaded successfully.',
        });
    };

    const handleSelect = (media: Media) => {
        if (mode === 'single') {
            setSelected([media]);
            onSelect([media]);
        } else {
            // Multiple selection mode
            if (selected.some(item => item.id === media.id)) {
                // Deselect if already selected
                const updatedSelection = selected.filter(item => item.id !== media.id);
                setSelected(updatedSelection);
                onSelect(updatedSelection);
            } else {
                // Check if limit reached
                if (limit && selected.length >= limit) {
                    toast.error('Selection limit reached', {
                        description: `You can select a maximum of ${limit} media items.`
                    });
                    return;
                }

                // Add to selection
                const updatedSelection = [...selected, media];
                setSelected(updatedSelection);
                onSelect(updatedSelection);
            }
        }
    };

    const isSelected = (media: Media): boolean => {
        return selected.some(item => item.id === media.id);
    };

    const handleClearSelection = () => {
        setSelected([]);
        onSelect([]);
    };

    const handlePreview = (media: Media) => {
        setPreviewMedia(media);
        setIsPreviewModalOpen(true);
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
                        <SelectableMediaCard
                            key={item.id}
                            media={item}
                            selected={isSelected(item)}
                            onSelect={() => handleSelect(item)}
                            onPreview={() => handlePreview(item)}
                            selectionMode={mode}
                        />
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "flex items-center border rounded-lg p-3 transition-colors",
                            isSelected(item)
                                ? "bg-primary/5 border-primary"
                                : "hover:bg-gray-50"
                        )}
                    >
                        <div
                            className={cn(
                                "flex-shrink-0 w-6 h-6 mr-3 rounded-full border flex items-center justify-center",
                                isSelected(item)
                                    ? "bg-primary border-primary text-white"
                                    : "border-gray-300"
                            )}
                            onClick={() => handleSelect(item)}
                        >
                            {isSelected(item) && <Check className="h-3 w-3" />}
                        </div>

                        <div className="h-12 w-12 mr-4 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            {item.type === 'image' ? (
                                <img
                                    src={item.thumbnailUrl || item.url}
                                    alt={item.alt || item.filename}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    {item.type === 'video' && '🎬'}
                                    {item.type === 'audio' && '🎵'}
                                    {item.type === 'document' && '📄'}
                                    {item.type === 'other' && '📁'}
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
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(item)}
                        >
                            Preview
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
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
                    {selected.length > 0 && (
                        <div className="text-sm bg-primary/10 text-primary rounded-full px-3 py-1 flex items-center gap-1">
                            <span>{selected.length} selected</span>
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

            {/* Filters */}
            <MediaFilters filters={filters} onFilterChange={handleFilterChange} />

            {/* Content */}
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

            {/* Footer with actions */}
            {onClose && (
                <div className="border-t pt-4 flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSelect(selected)}
                        disabled={mode === 'single' && selected.length === 0}
                    >
                        {mode === 'single' ? 'Select Media' : `Select ${selected.length} Items`}
                    </Button>
                </div>
            )}

            {/* Upload Modal */}
            <MediaUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={handleMediaUpload}
            />

            {/* Preview Modal */}
            {previewMedia && (
                <MediaDetailsModal
                    media={previewMedia}
                    isOpen={isPreviewModalOpen}
                    onClose={() => {
                        setIsPreviewModalOpen(false);
                        setPreviewMedia(null);
                    }}
                    onSave={() => { }}
                    isEditing={false}
                    setIsEditing={() => { }}
                />
            )}
        </div>
    );
};

export default SelectableMediaGallery;