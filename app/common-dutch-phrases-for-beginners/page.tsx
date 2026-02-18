import type { Metadata } from "next";
import Link from "next/link";
import { getTopHowToSay } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Common Dutch Phrases for Beginners",
  description: "Learn 25 common Dutch phrases with beginner-friendly translations and pronunciation notes."
};

export default function CommonDutchPhrasesForBeginnersPage() {
  const phrases = getTopHowToSay(25);

  const faqs = [
    {
      q: "What are the most useful Dutch phrases for beginners?",
      a: "Start with greetings, politeness phrases, and travel questions used in everyday conversations."
    },
    {
      q: "Should I learn phrases or individual words first?",
      a: "Beginners benefit from learning practical phrases first, then building vocabulary around them."
    },
    {
      q: "How many Dutch phrases should I learn first?",
      a: "A core set of 20 to 30 high-frequency phrases gives you a strong A1 foundation."
    },
    {
      q: "Can I use these Dutch phrases in Belgium?",
      a: "Yes, these common Dutch phrases are widely understood across Dutch-speaking regions."
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
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Common Dutch Phrases for Beginners</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        This starter list covers the phrases English-speaking beginners use most often in daily life, travel, and polite
        conversation.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-stroke/60">
        <table className="min-w-full divide-y divide-stroke/60 text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">English</th>
              <th className="px-4 py-3 font-semibold">Dutch</th>
              <th className="px-4 py-3 font-semibold">Page</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke/40 bg-white">
            {phrases.map((phrase) => (
              <tr key={phrase.slug}>
                <td className="px-4 py-3">{phrase.english}</td>
                <td className="px-4 py-3">{phrase.dutch}</td>
                <td className="px-4 py-3">
                  <Link href={`/how-to-say/${phrase.slug}`} className="text-slate-900 underline decoration-slate-300 underline-offset-4">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
