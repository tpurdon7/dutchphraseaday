import type { Metadata } from "next";
import Link from "next/link";
import { getA1Words } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "A1 Dutch Vocabulary List",
  description: "Browse a practical A1 Dutch vocabulary list with meanings, pronunciation, and beginner examples."
};

export default function A1DutchVocabularyListPage() {
  const words = getA1Words(50);

  const faqs = [
    {
      q: "What is A1 Dutch vocabulary?",
      a: "A1 vocabulary includes basic words used in greetings, shopping, travel, and everyday communication."
    },
    {
      q: "How many words do I need at A1 level?",
      a: "Many learners start with 300 to 500 core words, practiced in short phrases and simple dialogues."
    },
    {
      q: "Should I learn pronunciation with vocabulary?",
      a: "Yes, pairing each word with pronunciation early helps speaking confidence and listening comprehension."
    },
    {
      q: "How can I remember Dutch words faster?",
      a: "Use each word in a simple sentence, review daily, and connect related words by topic."
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
      <h1 className="text-3xl font-semibold tracking-tight text-ink">A1 Dutch Vocabulary List</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Use this A1 list as your core Dutch vocabulary base. Each entry links to a detail page with meaning,
        pronunciation, and examples.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {words.map((word) => (
          <li key={word.slug} className="rounded-xl border border-stroke/60 bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">{word.dutch}</p>
            <p className="text-sm text-slate-700">{word.english_meanings.join(", ")}</p>
            <Link href={`/meaning/${word.slug}`} className="mt-2 inline-block text-sm text-slate-900 underline decoration-slate-300 underline-offset-4">
              Open meaning page
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
