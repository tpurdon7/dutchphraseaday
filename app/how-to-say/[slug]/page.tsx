import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHowToSayBySlug, getRelatedHowToSay, howToSayData } from "@/lib/seo-data";

const baseUrl = "https://learndutchapp.com";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return howToSayData.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getHowToSayBySlug(slug);
  if (!entry) {
    return { title: "Not found" };
  }

  return {
    title: `How to say ${entry.english} in Dutch`,
    description: `Learn how to say ${entry.english} in Dutch with pronunciation, usage, and beginner examples.`
  };
}

export default async function HowToSayPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = getHowToSayBySlug(slug);
  if (!entry) notFound();

  const related = getRelatedHowToSay(entry.slug, 3);
  const url = `${baseUrl}/how-to-say/${entry.slug}`;

  const faqs = [
    {
      q: `How do you say ${entry.english} in Dutch?`,
      a: `You can say \"${entry.dutch}\" in Dutch.`
    },
    {
      q: `How do I pronounce ${entry.dutch}?`,
      a: `A simple pronunciation is \"${entry.phonetic}\"${entry.ipa ? ` (IPA: ${entry.ipa})` : ""}.`
    },
    {
      q: `When should I use ${entry.dutch}?`,
      a: entry.usage
    },
    {
      q: `Are there alternatives to ${entry.dutch}?`,
      a: entry.alternatives.length ? `Yes: ${entry.alternatives.join(", ")}.` : "This is the most common beginner option."
    }
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
      { "@type": "ListItem", position: 2, name: "How to say", item: `${baseUrl}/common-dutch-phrases-for-beginners` },
      { "@type": "ListItem", position: 3, name: entry.english, item: url }
    ]
  };

  return (
    <article className="rounded-3xl border border-stroke bg-white p-6 shadow-soft sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">How to say {entry.english} in Dutch</h1>
      <p className="mt-3 text-sm text-muted">
        Dutch: <strong>{entry.dutch}</strong> • Level {entry.level}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">Meaning</h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">
        {entry.english} in Dutch is <strong>{entry.dutch}</strong>.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">Pronunciation</h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">Phonetic: {entry.phonetic}</p>
      {entry.ipa ? <p className="text-sm leading-7 text-slate-700">IPA: {entry.ipa}</p> : null}

      <h2 className="mt-8 text-xl font-semibold text-ink">When to use</h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">{entry.usage}</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">Examples</h2>
      <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
        {entry.examples.map((example, index) => (
          <li key={`${entry.slug}-ex-${index}`} className="rounded-xl border border-stroke/60 bg-slate-50 p-3">
            <p className="font-medium">{example.nl}</p>
            <p className="text-muted">{example.en}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">Alternatives</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
        {entry.alternatives.map((alt) => (
          <li key={alt}>{alt}</li>
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

      <h3 className="mt-8 text-lg font-semibold text-ink">Related phrases</h3>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-700">
        {related.map((item) => (
          <li key={item.slug}>
            <Link href={`/how-to-say/${item.slug}`} className="text-slate-900 underline decoration-slate-300 underline-offset-4">
              How to say {item.english} in Dutch
            </Link>
          </li>
        ))}
      </ul>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </article>
  );
}
