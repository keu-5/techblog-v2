"use client";

import { Toggle } from "@/components/ui/toggle";
import { findCount } from "@/features/count/repositories/viewCountRepository";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { toast } from "sonner";

interface LikeCountButtonProps {
  slug: string;
  host: string;
}

//TODO: 使用するエンドポイントの修正
export const LikeCountButton = ({ slug, host }: LikeCountButtonProps) => {
  const [liked, setLiked] = useState(false);
  const [likedCount, setLikedCount] = useState(0);

  const addLikeCount = async () => {
    try {
      const response = await findCount(slug, host, "like");
      setLikedCount(response);
    } catch {
      toast("Failed to increment like count");
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
        {likedCount}
      </div>
    </Toggle>
  );
};
