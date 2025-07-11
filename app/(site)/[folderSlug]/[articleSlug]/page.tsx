import { RightSidebar } from "@/app/(site)/right-sidebar";
import { FolderData } from "@/components/common/folder-data";
import { Tags } from "@/components/composite/tags";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { LikeCountButton } from "@/features/count/components/like-count-button";
import { findLikedCount } from "@/features/count/repositories/likedCountRepository";
import { findViewCount } from "@/features/count/repositories/viewCountRepository";
import { MarkdownView } from "@/features/markdownView/components/markdown-view";
import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import { findDocs } from "@/features/searchResults/repositories/searchResultRepository";
import { siteSettingsData } from "@/lib/constants";

interface articleSlugPageProps {
  params: {
    folderSlug: string;
    articleSlug: string;
  };
}

export default async function articleSlugPage({
  params,
}: articleSlugPageProps) {
  const index =
    findDocs().docs.find(
      (doc) => doc.slug === `${params.folderSlug}/${params.articleSlug}`,
    ) || ({} as DocIndex);

  const [viewResult, likedResult] = await Promise.allSettled([
    findViewCount.show(index.slug),
    findLikedCount.show(index.slug),
  ]);

  const currentViewCount =
    viewResult.status === "fulfilled" ? viewResult.value : null;

  const currentLikedCount =
    likedResult.status === "fulfilled" ? likedResult.value : null;

  return (
    <div className="space-y-8 md:p-10 p-6 w-full rounded-md h-full lg:text-base text-xs z-[100]">
      <div className="w-full flex flex-col gap-2">
        <FolderData
          className="mb-2"
          folder={index.folder}
          updatedAt={index.updatedAt}
        />

        <h1 className="text-3xl font-bold dark:text-white text-black my-4">
          {index.title}
        </h1>

        <div className="flex flex-wrap gap-2 mb-3">
          <Tags tags={index.tags} />
        </div>

        <div className="flex items-center justify-between gap-4 mb-2">
          <p className="text-gray-500">
            {new Date(index.createdAt).toLocaleString()}
          </p>

          <div className="flex items-center gap-4">
            {currentViewCount && (
              <p className="text-gray-400">Views: {currentViewCount.upCount}</p>
            )}
            {currentLikedCount && (
              <p className="text-gray-400">
                Liked: {currentLikedCount.upCount}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8 w-full rounded-md h-full lg:text-base text-xs z-[100]">
        <MarkdownView markdownString={index.content || ""} />
      </div>

      <Separator className="mt-16 mb-4 bg-gray-400" />

      <div className="my-8 px-4 w-full flex justify-between items-center">
        <Link href="/">
          <div className="lg:flex gap-4 items-end">
            <h1 className="text-xl font-bold dark:text-gray-300 text-gray-700">
              {siteSettingsData.metaTitle}
            </h1>
            <small className="dark:text-gray-400 text-gray-800">
              {siteSettingsData.metaDescription}
            </small>
          </div>
        </Link>

        {currentLikedCount && (
          <LikeCountButton
            slug={index.slug}
            count={currentLikedCount.upCount}
          />
        )}
      </div>

      <div className="fixed top-12 right-12 w-1/5 p-4 h-screen hidden lg:block">
        <RightSidebar content={index.content} tags={index.tags} />
      </div>
    </div>
  );
}
