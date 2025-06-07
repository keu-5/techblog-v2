import { FolderData } from "@/components/common/folder-data";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocIndex } from "@/features/searchResults/models/SearchResultType";

interface RelatedPostsProps {
  docs: DocIndex[];
}

export const RelatedPosts = ({ docs }: RelatedPostsProps) => {
  return (
    <div className="flex flex-col gap-2 md:h-full h-0">
      <ScrollArea className="w-full h-full">
        {!docs.length && <p className="text-gray-500">No articles</p>}
        {docs.slice(0, 3).map((doc) => (
          <div
            key={doc.slug}
            className="w-full flex flex-col gap-3 rounded-lg p-4"
          >
            <FolderData folder={doc.folder} />

            <Link
              href={`/${doc.slug}`}
              className="text-base font-bold dark:text-white text-black mb-2 hover:underline"
            >
              {doc.title}
            </Link>

            <div className="flex flex-wrap gap-2">
              {doc.tags.map((tag) => (
                <Link
                  key={tag}
                  href={{
                    pathname: "articles",
                    query: {
                      tag: tag,
                    },
                  }}
                >
                  <Badge>{tag}</Badge>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 mb-2">
              <small className="text-gray-500">
                {new Date(doc.updatedAt).toLocaleDateString("ja-JP")}
              </small>
              {/* <div className="flex items-center gap-4">
                    <small className="text-gray-400">Views: {article.view_count}</small>
                    <small className="text-gray-400">Liked: {article.like_count}</small>
                  </div> */}
            </div>
          </div>
        ))}
      </ScrollArea>

      <Link href="/articles" className="text-sm text-right m-2 hover:underline">
        {docs.length - 3 > 0
          ? `Show ${docs.length - 3} more →`
          : "Show all articles →"}
      </Link>
    </div>
  );
};
