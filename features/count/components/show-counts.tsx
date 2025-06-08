"use client";

import { findCount } from "@/features/count/repositories/viewCountRepository";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ShowCountsProps {
  slug: string;
  host: string;
}

export const ShowCounts = ({ slug, host }: ShowCountsProps) => {
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const incrementCount = async () => {
      try {
        const response = await findCount(slug, host, "view");
        setViewCount(response);
      } catch {
        toast("Failed to increment view count");
      }
    };

    incrementCount();
  }, [slug]);

  return (
    <div className="flex items-center gap-4">
      <p className="text-gray-400">Views: {viewCount}</p>
      {/* <p className="text-gray-400">Liked: {articleData.like_count}</p> */}
    </div>
  );
};
