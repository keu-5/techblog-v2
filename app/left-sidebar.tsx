import { Logo } from "@/components/common/logo";
import { NewspaperIcon } from "@/components/icons/newspaper";
import { Button } from "@/components/ui/button";

import { Link } from "@/components/ui/link";
import { RelatedPosts } from "@/features/searchResults/components/related-posts";
import { SearchResults } from "@/features/searchResults/components/search-result";
import { DocIndex } from "@/features/searchResults/models/SearchResultType";

interface LeftSidebarProps {
  docs: DocIndex[];
}

export const LeftSidebar = ({ docs }: LeftSidebarProps) => {
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

      <SearchResults docs={docs} />

      <div
        className={`
          hidden h-0
          md:block md:h-full
        `}
      >
        <h2 className="mb-4 mt-8 text-base font-bold">Related posts</h2>
        <RelatedPosts docs={docs} />
      </div>
    </div>
  );
};
