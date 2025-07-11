"use client";

import {
  Pagination as Paginate,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
}

//TODO: サーバサイドコンポーネントにする
/**@package */
export const Pagination = ({ totalItems, itemsPerPage }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);

      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

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

  useEffect(() => {
    const pageFromUrl = searchParams.get("page");
    if (pageFromUrl) {
      const pageNumber = parseInt(pageFromUrl, 10);

      if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
      }
    }
  }, [searchParams, totalPages]);

  return (
    getPageNumbers().length > 1 && (
      <Paginate>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
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
                  href="#"
                  isActive={currentPage === page}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page as number);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
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
