import howToSayRaw from "@/data/how_to_say.json";
import wordsRaw from "@/data/words.json";

export type Example = { nl: string; en: string };

export type HowToSayEntry = {
  slug: string;
  english: string;
  dutch: string;
  phonetic: string;
  ipa?: string;
  usage: string;
  examples: Example[];
  alternatives: string[];
  level: string;
  tags: string[];
};

export type WordEntry = {
  slug: string;
  dutch: string;
  english_meanings: string[];
  part_of_speech: string;
  phonetic: string;
  ipa?: string;
  usage: string;
  examples: Example[];
  related: string[];
  level: string;
  tags: string[];
};

export const howToSayData = howToSayRaw as HowToSayEntry[];
export const wordsData = wordsRaw as WordEntry[];

function scoreTagOverlap(tagsA: string[], tagsB: string[]): number {
  const a = new Set(tagsA.map((t) => t.toLowerCase()));
  return tagsB.reduce((score, tag) => score + (a.has(tag.toLowerCase()) ? 1 : 0), 0);
}

export function getHowToSayBySlug(slug: string): HowToSayEntry | undefined {
  return howToSayData.find((item) => item.slug === slug);
}

export function getWordBySlug(slug: string): WordEntry | undefined {
  return wordsData.find((item) => item.slug === slug);
}

export function getRelatedHowToSay(slug: string, count = 3): HowToSayEntry[] {
  const current = getHowToSayBySlug(slug);
  if (!current) return [];

  return howToSayData
    .filter((item) => item.slug !== slug)
    .map((item) => ({
      item,
      score: scoreTagOverlap(current.tags, item.tags) + (current.level === item.level ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.item.english.localeCompare(b.item.english))
    .slice(0, count)
    .map(({ item }) => item);
}

export function getRelatedWords(slug: string, count = 3): WordEntry[] {
  const current = getWordBySlug(slug);
  if (!current) return [];

  const relatedBySlug = current.related
    .map((relatedSlug) => getWordBySlug(relatedSlug))
    .filter((item): item is WordEntry => Boolean(item));

  if (relatedBySlug.length >= count) {
    return relatedBySlug.slice(0, count);
  }

  const fallback = wordsData
    .filter((item) => item.slug !== slug && !relatedBySlug.some((rel) => rel.slug === item.slug))
    .map((item) => ({
      item,
      score: scoreTagOverlap(current.tags, item.tags) + (current.level === item.level ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.item.dutch.localeCompare(b.item.dutch))
    .slice(0, count - relatedBySlug.length)
    .map(({ item }) => item);

  return [...relatedBySlug, ...fallback];
}

export function getTopHowToSay(limit: number): HowToSayEntry[] {
  return howToSayData.slice(0, limit);
}

export function getA1Words(limit: number): WordEntry[] {
  return wordsData.filter((item) => item.level.toUpperCase() === "A1").slice(0, limit);
}

export function getTravelPhrases(): HowToSayEntry[] {
  return howToSayData.filter((item) => item.tags.some((tag) => tag.toLowerCase() === "travel"));
}
