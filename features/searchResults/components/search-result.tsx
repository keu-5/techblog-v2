"use client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SetStateAction, useEffect, useState } from "react";

import { NewspaperIcon } from "@/components/icons/newspaper";

import { Link } from "@/components/ui/link";

import {
  DocIndex,
  SearchResultType,
} from "@/features/searchResults/models/SearchResultType";
import Fuse from "fuse.js";

interface SearchResultProps {
  setIsFocused: (value: SetStateAction<boolean>) => void;
}

export const SearchResults = ({ setIsFocused }: SearchResultProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResultType[]>([]);
  const [fuseInstance, setFuseInstance] = useState<Fuse<DocIndex> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (fuseInstance && query.trim()) {
      const result: SearchResultType[] = fuseInstance
        .search(query)
        .slice(0, 10)
        .map((r) => {
          const snippet = r.item.content.slice(0, 100);
          return {
            id: r.item.slug,
            title: r.item.title,
            surrounding_text: snippet,
          };
        });
      setResults(result);
    } else {
      setResults([]);
    }
  };

  useEffect(() => {
    const fetchSearchIndex = async () => {
      try {
        const response = await fetch("/search-index.json");
        if (!response.ok) {
          throw new Error("Failed to fetch search index");
        }
        const data: DocIndex[] = await response.json();
        const fuse = new Fuse<DocIndex>(data, {
          keys: ["title", "summary", "tags", "content"],
          includeScore: true,
          threshold: 0.3,
        });

        setFuseInstance(fuse);
      } catch (error) {
        console.error("Error fetching search index:", error);
      }
    };

    fetchSearchIndex();
  }, []);

  return (
    <>
      <div
        className={`
              fixed left-0 top-0 z-[101] h-screen w-screen bg-black
              bg-opacity-50 backdrop-blur-sm
            `}
        onClick={() => setIsFocused(false)}
      />

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
              <NewspaperIcon className="size-4 shrink-0" />
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
  );
};
