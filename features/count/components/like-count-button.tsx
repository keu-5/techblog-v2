"use client";

import { Toggle } from "@/components/ui/toggle";
import { findLikedCount } from "@/features/count/repositories/likedCountRepository";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { toast } from "sonner";

interface LikeCountButtonProps {
  slug: string;
  count: number;
}

export const LikeCountButton = ({ slug, count }: LikeCountButtonProps) => {
  const [liked, setLiked] = useState(false);
  const [likedCount, setLikedCount] = useState(count || 0);

  const addLikeCount = async () => {
    try {
      const response = await findLikedCount.up(slug);
      setLikedCount(response.upCount);
      setLiked(true);
      toast("Thanks for liking!");
    } catch (error) {
      toast("Failed to increment like count}");
    }
  };

  return (
    <Toggle
      onClick={addLikeCount}
      variant="outline"
      asChild
      className="text-gray-400 border-gray-400"
      disabled={liked}
    >
      <div>
        {liked ? (
          <HeartFilledIcon className="w-4 h-4" />
        ) : (
          <HeartIcon className="w-4 h-4" />
        )}
        {liked ? likedCount + 1 : likedCount}
      </div>
    </Toggle>
  );
};
