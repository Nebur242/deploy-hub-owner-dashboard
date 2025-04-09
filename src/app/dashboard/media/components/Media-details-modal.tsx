// components/media/MediaDetailsModal.tsx
import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Download, ExternalLink, Edit, Save, Loader2 } from "lucide-react";
import { formatFileSize, formatDate } from "@/utils/media";
import { useUpdateMediaMutation } from "@/store/features/media";
import { Media } from "@/common/types";
import { MediaType } from "@/common/dtos";

interface MediaDetailsModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (media: Media) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  media,
  isOpen,
  onClose,
  onSave,
  isEditing,
  setIsEditing,
}) => {
  const [formData, setFormData] = React.useState<Partial<Media>>({});
  const [tagInput, setTagInput] = React.useState("");

  // RTK Query update mutation
  const [updateMedia, { isLoading: isUpdating }] = useUpdateMediaMutation();

  React.useEffect(() => {
    if (media) {
      setFormData({
        filename: media.filename,
        alt: media.alt,
        isPublic: media.isPublic,
        tags: [...media.tags],
      });
    }
  }, [media, isEditing]);

  if (!media) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const handleSave = async () => {
    if (!media || !formData) return;

    try {
      const updatedMedia = await updateMedia({
        id: media.id,
        data: formData,
      }).unwrap();

      onSave(updatedMedia);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update media:", error);
    }
  };

  const renderPreview = () => {
    if (media.type === MediaType.IMAGE) {
      return (
        <div className="relative w-full h-[300px] bg-background flex items-center justify-center">
          <Image
            src={media.url}
            alt={media.alt || media.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      );
    }

    if (media.type === MediaType.VIDEO) {
      return (
        <div className="w-full h-[300px] bg-background flex items-center justify-center p-4">
          <video
            controls
            className="max-h-full max-w-full rounded-md shadow-sm"
            poster={media.thumbnailUrl}
          >
            <source src={media.url} type={media.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (media.type === MediaType.AUDIO) {
      return (
        <div className="w-full bg-background p-8 flex flex-col items-center justify-center gap-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <audio controls className="w-full max-w-md rounded-md shadow-sm">
            <source src={media.url} type={media.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (media.type === MediaType.DOCUMENT) {
      return (
        <div className="w-full h-[300px] bg-background flex items-center justify-center relative">
          <iframe
            src={media.url}
            className="w-full h-full absolute inset-0 rounded-md shadow-sm"
            title={media.filename}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    }

    // Default for other file types
    return (
      <div className="w-full h-[300px] bg-background flex items-center justify-center">
        <div className="text-center p-6 rounded-xl bg-muted/40">
          <div className="text-6xl mb-4">
            {media.type === MediaType.OTHER ? "📄" : "📁"}
          </div>
          <p className="text-muted-foreground font-medium">{media.filename}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Preview not available for this file type
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="p-6 border-b sticky top-0 z-10 bg-background">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Media" : "Media Details"}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing && (
            <div className="mb-6">
              <div className="rounded-lg overflow-hidden border bg-muted/20 shadow-sm">
                {renderPreview()}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="filename" className="font-medium">
                    Name
                  </Label>
                  <Input
                    id="filename"
                    name="filename"
                    value={formData.filename || ""}
                    onChange={handleInputChange}
                    className="bg-background"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="alt" className="font-medium">
                    Alt Text
                  </Label>
                  <Textarea
                    id="alt"
                    name="alt"
                    value={formData.alt || ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="resize-y bg-background"
                    placeholder="Describe this media for accessibility"
                  />
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isPublic" className="font-medium">
                    Public
                  </Label>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formData.isPublic
                      ? "Anyone can access this file"
                      : "Only authenticated users can access this file"}
                  </span>
                </div>

                <div className="grid gap-3">
                  <Label className="font-medium">Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add tag and press Enter"
                      className="bg-background"
                    />
                    <Button
                      type="button"
                      onClick={handleTagAdd}
                      variant="secondary"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 min-h-10">
                    {formData.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1.5"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="focus:outline-none ml-1 hover:text-destructive"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {formData.tags?.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No tags added yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 rounded-lg border bg-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Filename
                    </h3>
                    <p className="text-foreground">{media.filename}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Original Filename
                    </h3>
                    <p className="text-foreground">{media.originalFilename}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Type
                    </h3>
                    <Badge variant="outline" className="bg-background">
                      {media.type}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Size
                    </h3>
                    <p className="text-foreground">
                      {formatFileSize(media.size)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      MIME Type
                    </h3>
                    <p className="text-foreground font-mono text-sm">
                      {media.mimeType}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Visibility
                    </h3>
                    <Badge variant={media.isPublic ? "default" : "secondary"}>
                      {media.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  {media.width && media.height && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Dimensions
                      </h3>
                      <p className="text-foreground">
                        {media.width} × {media.height} px
                      </p>
                    </div>
                  )}
                  {!!media.duration && media.duration > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Duration
                      </h3>
                      <p className="text-foreground">
                        {Math.floor(media.duration / 60)}:
                        {(media.duration % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Uploaded
                    </h3>
                    <p className="text-foreground">
                      {formatDate(media.createdAt)}
                    </p>
                  </div>
                  {media.updatedAt !== media.createdAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Last Updated
                      </h3>
                      <p className="text-foreground">
                        {formatDate(media.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {media.alt && (
                  <div className="p-4 rounded-lg border bg-card">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Alt Text
                    </h3>
                    <p className="text-foreground whitespace-pre-wrap">
                      {media.alt}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {media.tags.length > 0 ? (
                      media.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    URL
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input
                      value={media.url}
                      readOnly
                      className="font-mono text-xs bg-background"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(media.url);
                        // Show a toast or some feedback
                      }}
                      title="Copy URL"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </Button>
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                    >
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="p-6 border-t mt-auto sticky bottom-0 bg-background z-10">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex space-x-2">
                <a
                  href={media.url}
                  download={media.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaDetailsModal;
