"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconPlayerPlay, IconLoader } from "@tabler/icons-react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

type VideoType = "youtube" | "vimeo" | "self-hosted";

/**
 * Extracts video type and embed URL from various video sources
 */
function getVideoInfo(url: string): { type: VideoType; embedUrl: string } {
  // YouTube patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo patterns
  const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Self-hosted video (default)
  return {
    type: "self-hosted",
    embedUrl: url,
  };
}

export function VideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  title = "Tutorial Video",
}: VideoPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  const videoInfo = useMemo(() => getVideoInfo(videoUrl), [videoUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPlayerPlay className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <IconLoader className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {videoInfo.type === "self-hosted" ? (
            <video
              src={videoInfo.embedUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onLoadedData={handleVideoLoad}
              onCanPlay={handleVideoLoad}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={videoInfo.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={handleIframeLoad}
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VideoPlayerModal;
