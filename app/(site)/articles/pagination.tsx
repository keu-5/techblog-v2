import {
  Pagination as Paginate,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

/**@package */
export const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const visibleRange = 2;
    const pages: (number | "ellipsis")[] = [];

    if (currentPage > visibleRange + 1) {
      pages.push(1, "ellipsis");
    } else {
      for (let i = 1; i < Math.min(currentPage, visibleRange + 1); i++) {
        pages.push(i);
      }
    }

    for (
      let i = Math.max(1, currentPage - visibleRange);
      i <= Math.min(totalPages, currentPage + visibleRange);
      i++
    ) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - visibleRange) {
      pages.push("ellipsis", totalPages);
    } else {
      for (let i = currentPage + 1; i <= totalPages; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
    }

    return pages;
  };

  return (
    getPageNumbers().length > 1 && (
      <Paginate>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={`/articles?page=${currentPage - 1}`}
              aria-disabled={currentPage <= 1}
              tabIndex={currentPage <= 1 ? -1 : undefined}
              className={
                currentPage <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {getPageNumbers().map((page, idx) =>
            page === "ellipsis" ? (
              <PaginationEllipsis key={`ellipsis-${idx}`} />
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`/articles?page=${page}`}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href={`/articles?page=${currentPage + 1}`}
              aria-disabled={currentPage >= totalPages}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              className={
                currentPage >= totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Paginate>
    )
  );
};
