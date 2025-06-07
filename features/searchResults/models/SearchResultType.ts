export type DocIndex = {
  title: string;
  summary: string;
  tags: string[];
  slug: string;
  folder: string;
  content: string;
  updatedAt: string;
};

export type SearchResultType = {
  id: string;
  title: string;
  surrounding_text: string;
};
