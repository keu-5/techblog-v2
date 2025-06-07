import { FolderIcon } from "@/components/icons/folder";
import { Link } from "@/components/ui/link";
import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import { cn } from "@/lib/utils";

interface FolderDataProps {
  folder: DocIndex["folder"];
  updatedAt?: DocIndex["updatedAt"];
  className?: string;
}

export const FolderData = ({
  folder,
  updatedAt,
  className,
}: FolderDataProps) => {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <p className="flex justify-between items-center gap-1 text-sm">
        <FolderIcon className="h-3 w-3 text-gray-500" />
        <Link
          href={{
            pathname: "articles",
            query: {
              folder: folder,
            },
          }}
          className="hover:underline"
        >
          {folder || "Uncategorized"}
        </Link>
      </p>

      {updatedAt && (
        <p className="text-gray-500">
          Updated: {new Date(updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};
