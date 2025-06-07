import "./globals.css";

import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";

import { ThemeToggle } from "@/components/composite/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
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
          {children}

          <Toaster />
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
