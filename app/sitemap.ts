import { MetadataRoute } from "next";
import howToSayRaw from "@/data/how_to_say.json";
import wordsRaw from "@/data/words.json";

const baseUrl = "https://learndutchapp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const howToSay = (howToSayRaw as Array<{ slug: string }>).map((entry) => `/how-to-say/${entry.slug}`);
  const meaning = (wordsRaw as Array<{ slug: string }>).map((entry) => `/meaning/${entry.slug}`);

  const hubPages = [
    "/common-dutch-phrases-for-beginners",
    "/a1-dutch-vocabulary-list",
    "/dutch-travel-phrases"
  ];

  const urls = ["/", ...howToSay, ...meaning, ...hubPages];
  const lastModified = new Date();

  return urls.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8
  }));
}
