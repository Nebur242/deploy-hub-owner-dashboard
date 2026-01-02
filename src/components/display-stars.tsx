"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Display-only star rating
export function DisplayStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            rating >= star
              ? "fill-yellow-400 text-yellow-400"
              : rating >= star - 0.5
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export default DisplayStars;
