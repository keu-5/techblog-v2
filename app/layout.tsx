import "./globals.css";

import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";

import { LeftSidebar } from "@/app/left-sidebar";
import { ThemeToggle } from "@/components/composite/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { findDocs } from "@/features/searchResults/repositories/searchResultRepository";
import { ThemeProvider } from "@/providers/theme-provider";

const sourceCodePro = Source_Code_Pro({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "404 Not Found",
  description: "Either this page is private or doesn't exist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { docs } = findDocs();

  return (
    <html lang="ja">
      <body
        className={`
          ${sourceCodePro.className}
          bg-white text-black antialiased
          dark:bg-gray-800 dark:text-white
        `}
        style={{
          caretColor: "white",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeToggle>
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

            <Toaster />
          </ThemeToggle>
        </ThemeProvider>
      </body>
    </html>
  );
}
