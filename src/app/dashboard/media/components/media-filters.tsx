import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MediaType, MediaQueryParams } from '@/common/types/media';

interface MediaFiltersProps {
    filters: MediaQueryParams;
    onFilterChange: (filters: MediaQueryParams) => void;
}

const MediaFilters: React.FC<MediaFiltersProps> = ({ filters, onFilterChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [tagInput, setTagInput] = useState('');

    const mediaTypes = [
        { value: 'all', label: 'All Types' },
        { value: MediaType.IMAGE, label: 'Images' },
        { value: MediaType.VIDEO, label: 'Videos' },
        { value: MediaType.AUDIO, label: 'Audio' },
        { value: MediaType.DOCUMENT, label: 'Documents' },
        { value: MediaType.OTHER, label: 'Other' },
    ];

    const sortOptions = [
        { value: 'createdAt', label: 'Date Created' },
        { value: 'updatedAt', label: 'Date Updated' },
        { value: 'filename', label: 'Filename' },
        { value: 'size', label: 'File Size' },
    ];

    const orderOptions = [
        { value: 'DESC', label: 'Descending' },
        { value: 'ASC', label: 'Ascending' },
    ];

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchSubmit = () => {
        onFilterChange({ ...filters, search: searchTerm, page: 1 });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    const handleTypeChange = (value: string) => {
        onFilterChange({
            ...filters,
            page: 1,
            type: value === 'all' ? undefined : value as MediaType,
        });
    };

    const handleSortByChange = (value: string) => {
        onFilterChange({ ...filters, sortBy: value, page: 1 });
    };

    const handleOrderChange = (value: 'ASC' | 'DESC') => {
        onFilterChange({ ...filters, order: value, page: 1 });
    };

    const handleVisibilityChange = (value: string) => {
        onFilterChange({
            ...filters,
            isPublic: value === 'all' ? undefined : value === 'public',
            page: 1,
        });
    };

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const currentTags = filters.tags || [];
            if (!currentTags.includes(tagInput.trim())) {
                onFilterChange({
                    ...filters,
                    tags: [...currentTags, tagInput.trim()],
                    page: 1,
                });
            }
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        const currentTags = filters.tags || [];
        onFilterChange({
            ...filters,
            tags: currentTags.filter((t) => t !== tag),
            page: 1,
        });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        onFilterChange({
            page: 1,
            limit: filters.limit,
            sortBy: 'createdAt',
            order: 'DESC',
        });
    };

    return (
        <div className="space-y-4 bg-background p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search media..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        className="pl-8"
                    />
                </div>
                <Button onClick={handleSearchSubmit} variant="default">
                    Search
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label="Toggle filters"
                >
                    <Filter className="h-4 w-4" />
                </Button>
                {(filters.type ||
                    filters.isPublic !== undefined ||
                    (filters.tags && filters.tags.length > 0) ||
                    filters.sortBy !== 'createdAt' ||
                    filters.order !== 'DESC') && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                            Clear All
                        </Button>
                    )}
            </div>

            {isExpanded && (
                <div className="grid gap-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Media Type</label>
                            <Select
                                value={filters.type || 'all'} // Use 'all' instead of empty string
                                onValueChange={handleTypeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mediaTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Visibility</label>
                            <Select
                                value={
                                    filters.isPublic === undefined
                                        ? 'all'
                                        : filters.isPublic
                                            ? 'public'
                                            : 'private'
                                }
                                onValueChange={handleVisibilityChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="public">Public Only</SelectItem>
                                    <SelectItem value="private">Private Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sort By</label>
                            <div className="flex space-x-2">
                                <Select
                                    value={filters.sortBy || 'createdAt'}
                                    onValueChange={handleSortByChange}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.order || 'DESC'}
                                    onValueChange={(value) => handleOrderChange(value as 'ASC' | 'DESC')}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orderOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tags</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Input
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleTagInputKeyDown}
                                placeholder="Add tag and press Enter"
                                className="w-64"
                            />
                            {(filters.tags || []).map((tag) => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaFilters;
