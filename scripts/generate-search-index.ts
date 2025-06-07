import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import glob from "fast-glob";
import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const contentDir = path.join(process.cwd(), "content");
  const files = await glob("**/*.md", { cwd: contentDir, absolute: true });

  const docs: DocIndex[] = files.map((fullPath) => {
    const file = path.relative(contentDir, fullPath);
    const md = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(md);
    const stat = fs.statSync(fullPath);

    return {
      title: data.title ?? "",
      summary: data.summary ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      slug: file.replace(/\.md$/, ""),
      folder: path.dirname(file),
      content,
      createdAt: stat.birthtime.toISOString(),
      updatedAt: stat.mtime.toISOString(),
    };
  });

  docs.sort((a, b) => a.title.localeCompare(b.title));

  const outputPath = path.join(process.cwd(), "public", "search-index.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2), "utf-8");
}

main().catch((err) => {
  console.error("search-index.json生成中にエラー:", err);
  process.exit(1);
});
