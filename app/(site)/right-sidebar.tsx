import { Tags } from "@/components/composite/tags";
import { Link } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

interface RightSidebarProps {
  content: DocIndex["content"];
  tags: DocIndex["tags"];
}

function extractHeadings(markdown: string): { depth: number; text: string }[] {
  const tree = unified().use(remarkParse).parse(markdown);

  const headings: { depth: number; text: string }[] = [];

  visit(tree, "heading", (node: any) => {
    if (node.depth >= 1 && node.depth <= 3) {
      const text = node.children
        .filter((child: any) => child.type === "text")
        .map((child: any) => child.value)
        .join("");
      headings.push({ depth: node.depth, text });
    }
  });

  return headings;
}

export const RightSidebar = ({ content, tags }: RightSidebarProps) => {
  const headings = extractHeadings(content || "");

  return (
    <>
      <ScrollArea className="p-4 h-3/5">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Table for contents</h2>
          {!headings.length && <p className="text-gray-500">No headings</p>}
          <ul>
            {headings.map((heading, index) => (
              <li
                key={index}
                className="mb-1 line-clamp-1 text-gray-300"
                style={{ marginLeft: `${heading.depth - 1}rem` }}
              >
                <Link
                  href={`#${heading.text.replace(/\s+/g, "-").toLowerCase()}`}
                  className="dark:text-gray-300 text-gray-700 hover:underline text-xs"
                >
                  {heading.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Tags</h2>
        {!tags?.length && <p className="text-gray-500">No tags</p>}
        <div className="min-h-12 flex flex-row flex-wrap text-sm transition-colors gap-2 p-2">
          <Tags tags={tags} />
        </div>
      </div>
    </>
  );
};
