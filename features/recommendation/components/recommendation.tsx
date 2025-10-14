"use client";

import { FolderData } from "@/components/common/folder-data";
import { Tags } from "@/components/composite/tags";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import { recommendedPostSlugs } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RecommendationProps {
  docs: DocIndex[];
}

export const Recommendation = ({ docs }: RecommendationProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const router = useRouter();

  let recommendedDocs: DocIndex[] = [];

  if (recommendedPostSlugs.length > 0) {
    recommendedDocs = recommendedPostSlugs
      .map((slug) => docs.find((doc) => doc.slug === slug))
      .filter((doc): doc is DocIndex => doc !== undefined)
      .slice(0, 3);
  }

  if (recommendedDocs.length < 3) {
    const remainingCount = 3 - recommendedDocs.length;
    const usedSlugs = new Set([
      "index",
      ...recommendedDocs.map((doc) => doc.slug),
    ]);

    const latestDocs = docs
      .filter((doc) => !usedSlugs.has(doc.slug))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, remainingCount);

    recommendedDocs = [...recommendedDocs, ...latestDocs];
  }

  const handleCardClick = (slug: string) => {
    router.push(`/${slug}`);
  };

  return (
    <div className="space-y-4 my-8">
      <h2 className="text-2xl font-bold dark:text-white text-black">
        Recommended Posts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedDocs.slice(0, 3).map((doc, index) => (
          <div
            key={doc.slug}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleCardClick(doc.slug)}
          >
            <Card
              className={`h-full transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                hoveredIndex === index
                  ? "shadow-lg border-primary"
                  : "shadow hover:shadow-md"
              }`}
            >
              <CardHeader className="space-y-2">
                <FolderData folder={doc.folder} />
                <CardTitle className="text-lg font-bold dark:text-white text-black line-clamp-2">
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-sm line-clamp-2">
                  {doc.summary || "記事の概要がありません"}
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Tags tags={doc.tags} />
                </div>
                <div className="flex items-center justify-between gap-4 pt-2">
                  <small className="text-gray-500">
                    {new Date(doc.updatedAt).toLocaleDateString("ja-JP")}
                  </small>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
