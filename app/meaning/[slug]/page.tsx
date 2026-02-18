import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRelatedWords, getWordBySlug, wordsData } from "@/lib/seo-data";

const baseUrl = "https://learndutchapp.com";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return wordsData.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getWordBySlug(slug);
  if (!entry) return { title: "Not found" };

  return {
    title: `What does ${entry.dutch} mean in Dutch?`,
    description: `Beginner guide to ${entry.dutch}: meaning, pronunciation, and practical Dutch examples.`
  };
}

export default async function MeaningPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = getWordBySlug(slug);
  if (!entry) notFound();

  const related = getRelatedWords(entry.slug, 3);
  const url = `${baseUrl}/meaning/${entry.slug}`;

  const faqs = [
    { q: `What does ${entry.dutch} mean?`, a: `${entry.dutch} can mean ${entry.english_meanings.join(", ")}.` },
    { q: `How do you pronounce ${entry.dutch}?`, a: `Say it like \"${entry.phonetic}\"${entry.ipa ? ` (IPA: ${entry.ipa})` : ""}.` },
    { q: `What part of speech is ${entry.dutch}?`, a: `${entry.dutch} is a ${entry.part_of_speech}.` },
    { q: `How can beginners use ${entry.dutch}?`, a: entry.usage }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Meaning", item: `${baseUrl}/a1-dutch-vocabulary-list` },
      { "@type": "ListItem", position: 3, name: entry.dutch, item: url }
    ]
  };

  return (
    <article className="rounded-3xl border border-stroke bg-white p-6 shadow-soft sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">What does {entry.dutch} mean in Dutch?</h1>
      <p className="mt-3 text-sm text-muted">
        {entry.part_of_speech} • Level {entry.level}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">Meaning</h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">{entry.english_meanings.join(", ")}</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">Pronunciation</h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">Phonetic: {entry.phonetic}</p>
      {entry.ipa ? <p className="text-sm leading-7 text-slate-700">IPA: {entry.ipa}</p> : null}

      <h2 className="mt-8 text-xl font-semibold text-ink">Examples</h2>
      <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
        {entry.examples.map((example, index) => (
          <li key={`${entry.slug}-ex-${index}`} className="rounded-xl border border-stroke/60 bg-slate-50 p-3">
            <p className="font-medium">{example.nl}</p>
            <p className="text-muted">{example.en}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">Related words</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
        {related.map((item) => (
          <li key={item.slug}>
            <Link href={`/meaning/${item.slug}`} className="text-slate-900 underline decoration-slate-300 underline-offset-4">
              {item.dutch}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">FAQs</h2>
      <div className="mt-3 space-y-3">
        {faqs.map((faq) => (
          <div key={faq.q} className="rounded-xl border border-stroke/60 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">{faq.q}</p>
            <p className="mt-1 text-sm text-slate-700">{faq.a}</p>
          </div>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </article>
  );
}
