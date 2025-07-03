"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export type OptionType = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: OptionType[];
    values: OptionType[];
    onChange: (values: OptionType[]) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    emptyMessage?: string;
}

export function MultiSelect({
    options,
    values,
    onChange,
    placeholder = "Select options",
    isLoading = false,
    disabled = false,
    emptyMessage = "No options found.",
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (option: OptionType) => {
        const isSelected = values.findIndex((val) => val.value === option.value) > -1;

        if (isSelected) {
            onChange(values.filter((val) => val.value !== option.value));
        } else {
            onChange([...values, option]);
        }
    };

    const handleRemove = (option: OptionType) => {
        onChange(values.filter((val) => val.value !== option.value));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between",
                        values.length > 0 && "h-auto"
                    )}
                    onClick={() => setOpen(!open)}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1 text-left">
                        {values.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {values.map((option) => (
                                    <Badge
                                        key={option.value}
                                        variant="secondary"
                                        className="flex items-center gap-1 px-2 py-1"
                                    >
                                        {option.label}
                                        <button
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleRemove(option);
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRemove(option);
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            placeholder
                        )}
                    </div>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 shrink-0 opacity-50 animate-spin" />
                    ) : (
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search options..." />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                options.map((option) => {
                                    const isSelected = values.findIndex(
                                        (val) => val.value === option.value
                                    ) > -1;
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={() => handleSelect(option)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    );
                                })
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}