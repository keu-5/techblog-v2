import { getBaseUrl } from "@/lib/utils";
import glob from "fast-glob";
import fs from "node:fs";
import path from "node:path";

const baseUrl = getBaseUrl();

async function main() {
  const contentDir = path.join(process.cwd(), "content");
  const files = await glob("**/*.md", { cwd: contentDir, absolute: true });

  const urls = [`${baseUrl}/`, `${baseUrl}/articles`];

  for (const fullPath of files) {
    const file = path.relative(contentDir, fullPath);
    const slug = file.replace(/\.md$/, "");
    let folder = path.dirname(slug);
    const article = path.basename(slug);
    folder = folder === '.' ? '' : folder; // Treat '.' as the root directory
    const url = `${baseUrl}/${folder}/${article}`;
    urls.push(url);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    return `  <url><loc>${url}</loc></url>`;
  })
  .join("\n")}
</urlset>`;

  const outputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sitemap, "utf-8");
  console.log("✅ sitemap.xml generated!");
}

main().catch((err) => {
  console.error("sitemap.xml生成中にエラー:", err);
  process.exit(1);
});
