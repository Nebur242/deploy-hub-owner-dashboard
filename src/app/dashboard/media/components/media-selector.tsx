// components/media/media-selector.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2, Edit } from "lucide-react";
import { Media } from "@/common/types/media";
import MediaGallery from "./media-gallery";
import Image from "next/image";

interface SingleMediaSelectorProps {
  label: string;
  value?: Media | null;
  onChange: (media: Media | null) => void;
  required?: boolean;
}

export const SingleMediaSelector: React.FC<SingleMediaSelectorProps> = ({
  label,
  value,
  onChange,
  required = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = (selected: Media[]) => {
    onChange(selected[0] || null);
    setIsDialogOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="flex flex-col gap-2">
          {value ? (
            <div className="relative border rounded-md overflow-hidden group shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
              {value.type === "image" ? (
                <div className="relative h-40 bg-muted/50">
                  <Image
                    src={value.url}
                    alt={value.alt || value.filename}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-muted/30">
                  <div className="text-center">
                    <div className="mb-2">
                      {value.type === "video" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-purple-500 dark:text-purple-400 h-12 w-12"
                        >
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect
                            x="1"
                            y="5"
                            width="15"
                            height="14"
                            rx="2"
                            ry="2"
                          />
                        </svg>
                      )}
                      {value.type === "audio" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-amber-500 dark:text-amber-400 h-12 w-12"
                        >
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      )}
                      {value.type === "document" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-emerald-500 dark:text-emerald-400 h-12 w-12"
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                      {value.type === "other" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-slate-500 dark:text-slate-400 h-12 w-12"
                        >
                          <path d="M18 3v4c0 2-2 4-4 4H2" />
                          <path d="M18 3a2 2 0 1 1 4 0v14a2 2 0 1 1-4 0V3z" />
                          <path d="M2 7v10c0 2 2 4 4 4h8" />
                        </svg>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {value.filename}
                    </div>
                  </div>
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="shadow-sm">
                    <Edit className="h-4 w-4 mr-1" /> Change
                  </Button>
                </DialogTrigger>
                <Button
                  size="sm"
                  variant="destructive"
                  className="shadow-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-40 border-dashed flex flex-col gap-2 hover:bg-muted/20 transition-all duration-200 hover:border-primary/40"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Select {label}</span>
              </Button>
            </DialogTrigger>
          )}
        </div>

        <DialogContent
          className="max-w-5xl p-0"
          style={{ maxWidth: "80vw", maxHeight: "90vh" }}
        >
          <div className="p-8">
            <MediaGallery
              selectable={true}
              mode="single"
              selectedMedia={value ? [value] : []}
              onSelect={handleSelect}
              onClose={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface MultipleMediaSelectorProps {
  label: string;
  value: Media[];
  onChange: (media: Media[]) => void;
  limit?: number;
  required?: boolean;
}

export const MultipleMediaSelector: React.FC<MultipleMediaSelectorProps> = ({
  label,
  value = [],
  onChange,
  limit,
  required = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = (selected: Media[]) => {
    onChange(selected);
    setIsDialogOpen(false);
  };

  const handleRemove = (mediaToRemove: Media) => {
    onChange(value.filter((item) => item.id !== mediaToRemove.id));
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {limit && (
          <span className="text-gray-500 text-sm ml-2">(Max {limit})</span>
        )}
      </Label>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {value.map((media) => (
              <div
                key={media.id}
                className="relative border rounded-md overflow-hidden group shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                {media.type === "image" ? (
                  <div className="relative h-32 bg-muted/50">
                    <Image
                      src={media.url}
                      alt={media.alt || media.filename}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center bg-muted/30">
                    <div className="text-center">
                      <div className="mb-1">
                        {media.type === "video" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-purple-500 dark:text-purple-400 h-10 w-10"
                          >
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect
                              x="1"
                              y="5"
                              width="15"
                              height="14"
                              rx="2"
                              ry="2"
                            />
                          </svg>
                        )}
                        {media.type === "audio" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-500 dark:text-amber-400 h-10 w-10"
                          >
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="16" r="3" />
                          </svg>
                        )}
                        {media.type === "document" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-emerald-500 dark:text-emerald-400 h-10 w-10"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}
                        {media.type === "other" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-slate-500 dark:text-slate-400 h-10 w-10"
                          >
                            <path d="M18 3v4c0 2-2 4-4 4H2" />
                            <path d="M18 3a2 2 0 1 1 4 0v14a2 2 0 1 1-4 0V3z" />
                            <path d="M2 7v10c0 2 2 4 4 4h8" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium truncate px-2">
                        {media.filename}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover overlay with action */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="shadow-sm"
                    onClick={() => handleRemove(media)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add button */}
            {(!limit || value.length < limit) && (
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-32 border-dashed flex flex-col gap-2 hover:bg-muted/20 transition-all duration-200 hover:border-primary/40"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Add {label}</span>
                </Button>
              </DialogTrigger>
            )}
          </div>
        </div>

        <DialogContent
          className="max-w-5xl p-0"
          style={{ maxWidth: "80vw", maxHeight: "90vh" }}
        >
          <MediaGallery
            selectable={true}
            mode="multiple"
            selectedMedia={value}
            onSelect={handleSelect}
            onClose={() => setIsDialogOpen(false)}
            limit={limit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
