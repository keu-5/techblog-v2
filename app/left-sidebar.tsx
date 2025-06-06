"use client";
import { useState } from "react";

import { Logo } from "@/components/common/logo";
import { NewspaperIcon } from "@/components/icons/newspaper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const LeftSidebar = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; title: string; surrounding_text: string }[]
  >([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

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

      {isFocused && (
        <>
          {/* オーバーレイ */}
          <div
            className={`
              fixed left-0 top-0 z-[101] h-screen w-screen bg-black
              bg-opacity-50 backdrop-blur-sm
            `}
            onClick={() => setIsFocused(false)}
          ></div>

          {/* 検索結果のポップアップ */}
          <div
            className={`
              fixed left-[10%] top-16 z-[102] w-4/5 rounded-lg bg-gray-100 p-4
              shadow
              dark:bg-gray-900
              md:left-1/4 md:w-1/2
            `}
          >
            <Input
              placeholder="Search articles"
              className="mb-5 flex w-full flex-1 border-gray-500"
              value={searchQuery}
              onChange={handleInputChange}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              style={{
                caretColor: "black",
              }}
            />
            <ScrollArea
              className={cn(
                "max-h-96 w-full overflow-y-auto",
                results?.length > 10 ? "h-96" : "",
              )}
            >
              <p className="p-2 text-gray-500">Results</p>

              {results.map((result) => (
                <Link
                  href={`/${result.id}`}
                  key={result.id}
                  className={`
                    group flex items-center gap-4 rounded-lg p-2
                    hover:bg-gray-300
                    dark:hover:bg-gray-700
                  `}
                >
                  <NewspaperIcon className="size-4" />
                  <div
                    className={`
                      line-clamp-1 flex flex-col gap-1 transition-transform
                      duration-300
                      group-hover:translate-x-2
                    `}
                  >
                    <p>{result.title}</p>
                    <small className="text-gray-400">
                      ...{result.surrounding_text}...
                    </small>
                  </div>
                </Link>
              ))}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};
