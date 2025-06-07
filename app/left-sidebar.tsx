"use client";
import { useState } from "react";

import { Logo } from "@/components/common/logo";
import { NewspaperIcon } from "@/components/icons/newspaper";
import { Button } from "@/components/ui/button";

import { Link } from "@/components/ui/link";
import { SearchResults } from "@/features/searchResults/components/search-result";

export const LeftSidebar = () => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative h-3/5">
      <div className="flex items-center justify-between">
        <Logo />

        <Button
          className={`
            text-gray-400
            md:hidden
          `}
          asChild
          variant="outline"
          size="icon"
        >
          <Link href="/articles" className="text-right text-sm">
            <NewspaperIcon className="inline size-3" />
          </Link>
        </Button>
      </div>

      <button
        className={`
          flex h-9 w-full flex-1 cursor-text items-center rounded-md border
          border-gray-500 bg-transparent px-3 py-1 text-base text-gray-500
          shadow-sm transition-colors
          file:border-0 file:bg-transparent file:text-sm file:font-medium
          file:text-foreground
          placeholder:text-muted-foreground
          focus-visible:outline-none focus-visible:ring-1
          focus-visible:ring-ring
          disabled:cursor-not-allowed disabled:opacity-50
          md:text-sm
        `}
        onClick={() => setIsFocused(true)}
      >
        Search articles
      </button>

      <div
        className={`
          hidden h-0
          md:block md:h-full
        `}
      >
        <h2 className="mb-4 mt-8 text-base font-bold">Related posts</h2>
        <p>related posts</p>
      </div>

      {isFocused && <SearchResults setIsFocused={setIsFocused} />}
    </div>
  );
};
