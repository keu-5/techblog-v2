import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CodeView } from "@/features/markdownView/components/code-view";
import "highlight.js/styles/tokyo-night-dark.css";
import "katex/dist/katex.min.css";
import { ExternalLink, Flame, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";

const extractHeadingText = (node: any): string => {
  const firstChild = (node as Element)?.children?.[0];
  if (firstChild && typeof firstChild === "object" && "value" in firstChild) {
    return String(firstChild.value);
  }
  return "";
};

export const MarkdownView = ({
  markdownString,
}: {
  markdownString: string;
}) => {
  const memoizedMarkdown = useMemo(() => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkToc]}
        rehypePlugins={[
          [rehypeKatex, { strict: true, throwOnError: true }],
          rehypeHighlight,
          rehypeRaw,
        ]}
        components={{
          h1: ({ node, ...props }) => {
            const title = extractHeadingText(node);
            const id = title.replace(/\s+/g, "-").toLowerCase();
            return (
              <h1
                id={id}
                className="dark:text-gray-100 text-gray-900 text-xl font-semibold group"
                {...props}
              >
                <Link href={`#${id}`}>
                  <span className="dark:group-hover:text-white group-hover:text-black">
                    {props.children}
                  </span>
                  <LinkIcon className="ml-2 inline h-5 w-5 invisible group-hover:visible dark:text-gray-400 text-gray-800" />
                </Link>
              </h1>
            );
          },
          h2: ({ node, ...props }) => {
            const title = extractHeadingText(node);
            const id = title.replace(/\s+/g, "-").toLowerCase();
            return (
              <h2
                id={id}
                className="dark:text-gray-100 text-gray-900 text-lg font-semibold group"
                {...props}
              >
                <Link href={`#${id}`}>
                  <span className="dark:group-hover:text-white group-hover:text-black">
                    {props.children}
                  </span>
                  <LinkIcon className="ml-2 inline h-4 w-4 invisible group-hover:visible dark:text-gray-400 text-gray-800" />
                </Link>
              </h2>
            );
          },
          h3: ({ node, ...props }) => {
            const title = extractHeadingText(node);
            const id = title.replace(/\s+/g, "-").toLowerCase();
            return (
              <h3
                id={id}
                className="dark:text-gray-100 text-gray-900 text-base font-semibold group"
                {...props}
              >
                <Link href={`#${id}`}>
                  <span className="dark:group-hover:text-white group-hover:text-black">
                    {props.children}
                  </span>
                  <LinkIcon className="ml-1 inline h-4 w-4 invisible group-hover:visible dark:text-gray-400 text-gray-800" />
                </Link>
              </h3>
            );
          },
          ul: ({ ...props }) => (
            <ul
              className="list-disc pl-6 dark:text-gray-300 text-gray-600"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="list-decimal pl-6 dark:text-gray-300 text-gray-600"
              {...props}
            />
          ),
          li: ({ ...props }) => <li className="mb-1" {...props} />,
          a: ({ ...props }) => (
            <Link
              href={`${props.href}`}
              className="hover:underline block break-words max-w-full dark:text-gray-300 text-gray-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.children}
              <ExternalLink size={12} className="inline ml-1" />
            </Link>
          ),
          table: ({ ...props }) => (
            <ScrollArea className="overflow-auto w-full rounded-lg">
              {" "}
              {/* スクロールエリアにoverflow-autoを追加 */}
              <Table
                className="bg-transparent dark:text-white text-black border border-none shadow-md"
                {...props}
              >
                {props.children}
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ),
          thead: ({ ...props }) => (
            <TableHeader className="[&_tr]:border-none" {...props} />
          ),
          tr: ({ ...props }) => (
            <TableRow
              className="border-t border-gray-700 dark:hover:bg-gray-700"
              {...props}
            />
          ),
          th: ({ ...props }) => (
            <TableHead
              className="py-2 px-2 text-left dark:text-gray-300 text-gray-600"
              {...props}
            />
          ),
          tbody: ({ ...props }) => <TableBody {...props} />,
          td: ({ ...props }) => <TableCell className="min-w-52" {...props} />,
          strong: ({ ...props }) => (
            <strong style={{ fontWeight: "900" }} {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="dark:bg-cyan-900 bg-gray-100 rounded-md italic p-4 text-base mb-6 flex flex-col gap-2 overflow-hidden"
              {...props}
            >
              <p className="not-italic dark:text-blue-200 text-blue-700">
                <Flame className="h-4 w-4 inline" /> Tip
              </p>
              <span className="mx-3 dark:text-white text-gray-800 break-words">
                {props.children}
              </span>
            </blockquote>
          ),
          span: ({ className, children, ...props }) => {
            if (className === "katex-display") {
              return (
                <ScrollArea>
                  <span className={className} {...props}>
                    {children}
                  </span>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              );
            }
            return (
              <span className={className} {...props}>
                {children}
              </span>
            );
          },
          code: ({ className, children, ...props }) => {
            if (className?.startsWith("hljs")) {
              return (
                <CodeView className={className} {...props}>
                  {children}
                </CodeView>
              );
            }
            return (
              <code
                className="dark:bg-gray-600 bg-gray-200 rounded-lg p-0.5"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {markdownString}
      </ReactMarkdown>
    );
  }, [markdownString]);

  return memoizedMarkdown;
};
