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

    const relativePath = path.join("/", slug);
    const url = `${baseUrl}${relativePath}`;
    urls.push(url);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  const outputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sitemap, "utf-8");
  console.log("✅ sitemap.xml generated!");
}

main().catch((err) => {
  console.error("Error occurred while generating sitemap.xml:", err);
  process.exit(1);
});
