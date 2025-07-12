import { DocIndex } from "@/features/searchResults/models/SearchResultType";
import chokidar from "chokidar";
import glob from "fast-glob";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

const contentDir = path.join(process.cwd(), "content");
const outputPath = path.join(process.cwd(), "public", "search-index.json");

function triggerRerender() {
  const flagPath = path.join(process.cwd(), "lib", "force-refresh.ts");
  const ts = new Date().toISOString();
  fs.writeFileSync(flagPath, `// refreshed at ${ts}\n`);
}

async function generateSearchIndex() {
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
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2), "utf-8");

  console.log(`[search-index.json] Updated: ${new Date().toISOString()}`);
}

async function main() {
  await generateSearchIndex();

  chokidar
    .watch(contentDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    })
    .on("add", () => {
      generateSearchIndex();
      triggerRerender();
    })
    .on("change", () => {
      generateSearchIndex();
      triggerRerender();
    })
    .on("unlink", () => {
      generateSearchIndex();
      triggerRerender();
    });
}

main();
