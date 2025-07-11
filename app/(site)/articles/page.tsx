import { Pagination } from "@/app/(site)/articles/pagination";
import { FolderIcon } from "@/components/icons/folder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { findDocs } from "@/features/searchResults/repositories/searchResultRepository";
import { format } from "date-fns";

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const ITEMS_PER_PAGE = 8;

export default function Page({ searchParams }: PageProps) {
  let articles = findDocs().docs.filter((doc) => doc.slug !== "index");
  const currentPage = parseInt(searchParams.page as string) || 1;

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;

  if (searchParams.folder) {
    articles = articles.filter(
      (article) => article.folder === searchParams.folder,
    );
  }
  if (searchParams.tag) {
    articles = articles.filter((article) =>
      article.tags.includes(searchParams.tag as string),
    );
  }

  let currentItems = articles.slice(startIdx, endIdx);

  return (
    <div className="space-y-8 p-10 w-full rounded-md h-full z-[100]">
      <div className="flex items-center justify-between w-full mb-16">
        <h1 className="text-2xl font-bold">Articles</h1>
        {(searchParams.folder || searchParams.tag) && (
          <Button className="text-xs">
            <Link href="/articles">Reset filtering</Link>
          </Button>
        )}
      </div>
      {!currentItems.length && (
        <p className="text-gray-500">There is no articles</p>
      )}
      {currentItems.map((article) => (
        <div
          key={article.slug}
          className="2xl:flex items-start justify-between"
        >
          <div className="md:flex block items-start gap-3">
            <p className="whitespace-nowrap text-gray-400">
              {format(new Date(article.createdAt), "MMM dd, yyyy")}
            </p>
            <div className="flex flex-col md:w-96 w-full">
              <Link href={`/${article.slug}`} className="hover:underline">
                {article.title}
              </Link>
              <small className="line-clamp-2 text-gray-400">
                {article.summary}
              </small>
              <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <FolderIcon className="h-2 w-2 text-gray-500" />
                <Link
                  href={{
                    query: {
                      folder: article.folder,
                      tag: searchParams.tag,
                    },
                  }}
                  className="hover:underline"
                >
                  {article.folder}
                </Link>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 2xl:mt-0 mt-1">
            {article.tags.map((tagId) => (
              <Link
                key={tagId}
                href={{
                  query: {
                    folder: searchParams.folder,
                    tag: tagId,
                  },
                }}
              >
                <Badge>{tagId}</Badge>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <Pagination
        totalItems={articles.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
      />
    </div>
  );
}
