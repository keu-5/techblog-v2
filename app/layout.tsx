import { ThemeToggle } from "@/components/composite/theme-toggle";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";

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
        className={`${sourceCodePro.className} antialiased dark:bg-gray-800 bg-white dark:text-white text-black`}
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
          <ThemeToggle>{children}</ThemeToggle>
        </ThemeProvider>
      </body>
    </html>
  );
}
