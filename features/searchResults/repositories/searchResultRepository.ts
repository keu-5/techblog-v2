import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import fs from "node:fs";
import path from "node:path";

export const findDocs = (): { docs: DocIndex[] } => {
  const filePath = path.join(process.cwd(), "public", "search-index.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const docs: DocIndex[] = JSON.parse(fileContent);
  return { docs };
};
