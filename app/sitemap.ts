import type { MetadataRoute } from "next";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { phraseById } from "@/data/phrases";

const BASE_URL = "https://learndutchapp.com";
const APP_DIR = path.join(process.cwd(), "app");
const PAGE_FILE_RE = /^page\.(tsx|ts|jsx|js|mdx)$/;

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await readdir(targetPath);
    return true;
  } catch {
    return false;
  }
}

function toRoutePath(dirPath: string): string {
  const rel = path.relative(APP_DIR, dirPath);
  if (!rel || rel === ".") return "/";

  const segments = rel
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("(") && !segment.startsWith("@"));

  if (segments.some((segment) => segment.includes("["))) {
    return "";
  }

  return `/${segments.join("/")}`;
}

async function collectSectionRoutes(section: "words" | "phrases"): Promise<Set<string>> {
  const root = path.join(APP_DIR, section);
  const results = new Set<string>();

  if (!(await pathExists(root))) {
    return results;
  }

  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && PAGE_FILE_RE.test(entry.name)) {
        const route = toRoutePath(path.dirname(fullPath));
        if (route) {
          results.add(route);
        }
      }
    }
  }

  return results;
}

async function collectDynamicPhraseRoutes(): Promise<string[]> {
  const dynamicIdDir = path.join(APP_DIR, "phrases", "[id]");
  if (!(await pathExists(dynamicIdDir))) {
    return [];
  }

  return Array.from(phraseById.keys())
    .sort((a, b) => a - b)
    .map((id) => `/phrases/${id}`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [wordRoutes, phraseRoutes, dynamicPhraseRoutes] = await Promise.all([
    collectSectionRoutes("words"),
    collectSectionRoutes("phrases"),
    collectDynamicPhraseRoutes()
  ]);

  const allRoutes = new Set<string>(["/", ...wordRoutes, ...phraseRoutes, ...dynamicPhraseRoutes]);

  const now = new Date();
  return Array.from(allRoutes)
    .sort()
    .map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: route === "/" ? 1 : 0.7
    }));
}
