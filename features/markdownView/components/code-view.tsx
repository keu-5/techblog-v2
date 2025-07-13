"use client";
import { ClipBoardIcon } from "@/components/icons/clipboard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Mermaid } from "@/features/markdownView/components/mermaid";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "sonner";

interface CodeViewProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children: React.ReactNode;
}

const extractLanguage = (className: string): string | null => {
  const match = className.match(/language-([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const CodeView = ({ className, children, ...props }: CodeViewProps) => {
  const textRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (textRef.current) {
      const text = textRef.current.innerText; // innerTextでテキストを取得
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast("Copied to clipboard!");
        })
        .catch(() => {
          toast("Failed to copy code");
        });
    }
  };

  return (
    <code className={cn(className, "rounded-lg")} {...props}>
      <div className="group pb-6 px-2">
        <div className="flex justify-between items-center mb-2 invisible group-hover:visible">
          <p className="lg:text-sm text-xs">
            {extractLanguage(className || "") || "plaintext"}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 hover:bg-gray-700 hover:text-gray-300 rounded-md text-gray-400"
          >
            <ClipBoardIcon className="h-4 w-4" />
          </button>
        </div>
        <ScrollArea className="lg:text-sm text-xs" ref={textRef}>
          {className?.includes("language-mermaid") ? (
            <Mermaid>{children}</Mermaid>
          ) : (
            <div className="mb-4">{children}</div>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </code>
  );
};
