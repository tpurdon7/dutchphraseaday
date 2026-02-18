import type { Metadata } from "next";
import Link from "next/link";
import { getTravelPhrases } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Dutch Travel Phrases",
  description: "Essential Dutch travel phrases for beginners with clear translations and practical examples."
};

export default function DutchTravelPhrasesPage() {
  const travelPhrases = getTravelPhrases();

  const faqs = [
    {
      q: "What Dutch phrases are most useful for travel?",
      a: "Focus on directions, ordering food, buying tickets, and polite phrases used in shops and transport."
    },
    {
      q: "Can I travel in the Netherlands with basic Dutch?",
      a: "Yes, basic Dutch phrases improve local interactions even though many people also speak English."
    },
    {
      q: "How do I practice Dutch travel phrases quickly?",
      a: "Repeat phrases aloud daily and pair each one with a common real-world travel scenario."
    },
    {
      q: "Should I learn formal or informal travel Dutch?",
      a: "Beginners should start with polite neutral forms that work in most travel situations."
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

  return (
    <article className="rounded-3xl border border-stroke bg-white p-6 shadow-soft sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Dutch Travel Phrases</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        These Dutch travel phrases cover public transport, restaurants, directions, and day-to-day polite interactions.
      </p>

      <ul className="mt-8 space-y-3">
        {travelPhrases.map((phrase) => (
          <li key={phrase.slug} className="rounded-xl border border-stroke/60 bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">{phrase.english}</p>
            <p className="text-sm text-slate-700">{phrase.dutch}</p>
            <Link href={`/how-to-say/${phrase.slug}`} className="mt-2 inline-block text-sm text-slate-900 underline decoration-slate-300 underline-offset-4">
              View phrase page
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
    </article>
  );
}
