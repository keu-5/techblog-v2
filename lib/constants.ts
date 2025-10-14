const siteSettingsData = {
  metaTitle: "Tech Blog",
  metaDescription: "Talking to oneself about what I've learned",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
};

const recommendedPostSlugs: string[] = [
  "Next.js/techblog-making",
  "Next.js/api-client-automation",
  "docker/uv-venv",
];

export { recommendedPostSlugs, siteSettingsData };
