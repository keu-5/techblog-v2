import { LeftSidebar } from "@/app/left-sidebar";
import { findDocs } from "@/features/searchResults/repositories/searchResultRepository";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { docs } = findDocs();

  return (
    <div
      className={`
                h-full
                md:mx-12 md:mt-12
              `}
    >
      <div
        className={`
                  left-12 top-12 z-[105] w-full p-4
                  md:fixed md:h-screen md:w-1/4
                  lg:w-1/5
                `}
      >
        <LeftSidebar docs={docs} />
      </div>

      <div
        className={`
                  size-full p-4
                  md:ml-[25%] md:w-3/4
                  lg:ml-[20%] lg:w-3/5
                `}
      >
        {children}
      </div>
    </div>
  );
}
