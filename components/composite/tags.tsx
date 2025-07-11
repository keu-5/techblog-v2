import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";

interface TagsProps {
  tags: string[];
}

export const Tags = ({ tags }: TagsProps) => {
  return tags.map((tag) => (
    <Link
      key={tag}
      href={{
        pathname: "/articles",
        query: {
          tag,
        },
      }}
    >
      <Badge>{tag}</Badge>
    </Link>
  ));
};
