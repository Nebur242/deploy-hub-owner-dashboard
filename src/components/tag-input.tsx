"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    suggestions?: string[];
    maxLength?: number;
}

export function TagInput({
    value = [],
    onChange,
    placeholder = "Add tag...",
    disabled = false,
    suggestions = [],
    maxLength = 50,
}: TagInputProps) {
    const [inputValue, setInputValue] = React.useState("");
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const suggestionRef = React.useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const filteredSuggestions = React.useMemo(() => {
        if (!inputValue.trim()) return [];
        return suggestions.filter(
            (suggestion) =>
                suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
                !value.includes(suggestion)
        ).slice(0, 5); // Limit to 5 suggestions
    }, [inputValue, suggestions, value]);

    // Handle adding a new tag
    const handleAddTag = React.useCallback((tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !value.includes(trimmedTag)) {
            onChange([...value, trimmedTag]);
            setInputValue("");
        }
    }, [value, onChange]);

    // Handle removing a tag
    const handleRemoveTag = React.useCallback((index: number) => {
        const newTags = [...value];
        newTags.splice(index, 1);
        onChange(newTags);
    }, [value, onChange]);

    // Handle input key events (Enter adds the tag)
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault();
            handleAddTag(inputValue);
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            handleRemoveTag(value.length - 1);
        }
    }, [inputValue, value.length, handleAddTag, handleRemoveTag]);

    // Close suggestions when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                suggestionRef.current &&
                !suggestionRef.current.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full">
            {/* Tags display area */}
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="secondary" className="px-3 py-1">
                        {tag}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2 opacity-70 hover:opacity-100"
                            onClick={() => handleRemoveTag(index)}
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {tag}</span>
                        </Button>
                    </Badge>
                ))}
            </div>

            {/* Input and add button */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        maxLength={maxLength}
                        className="w-full"
                    />

                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div
                            ref={suggestionRef}
                            className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden"
                        >
                            {filteredSuggestions.map((suggestion) => (
                                <div
                                    key={suggestion}
                                    className="px-4 py-2 cursor-pointer hover:bg-muted"
                                    onClick={() => {
                                        handleAddTag(suggestion);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button
                    type="button"
                    onClick={() => handleAddTag(inputValue)}
                    disabled={!inputValue.trim() || disabled}
                    size="sm"
                >
                    Add
                </Button>
            </div>
        </div>
    );
}