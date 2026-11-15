import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { filledBusinessInfo } from "@/lib/business-info";
import { LEGAL_DOCS, LEGAL_NOTE, LEGAL_UPDATED, legalDoc } from "@/lib/legal";

type Props = { params: Promise<{ doc: string }> };

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = legalDoc((await params).doc);
  return d ? { title: `${d.title} · 사주300`, description: d.summary } : {};
}

export default async function LegalPage({ params }: Props) {
  const doc = legalDoc((await params).doc);
  if (!doc) notFound();
  const info = filledBusinessInfo();

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">{doc.title}</h1>
      </header>

      <main className="px-4 pb-20 pt-4">
        <p className="rounded-card border border-gold/30 bg-surface p-4 text-sm">{doc.summary}</p>
        <p className="mt-2 text-xs text-text-sub">
          {LEGAL_NOTE} (기준일 {LEGAL_UPDATED})
        </p>

        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-6" aria-labelledby={`h-${s.heading}`}>
            <h2 id={`h-${s.heading}`} className="font-serif text-lg font-bold text-gold">
              {s.heading}
            </h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-2 text-sm leading-relaxed">
                {p}
              </p>
            ))}
            {s.items && (
              <ul className="mt-2 space-y-2">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-2 text-sm leading-relaxed">
                    <span aria-hidden="true" className="text-gold">
                      ·
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {info.length > 0 && (
          <section className="mt-6" aria-label="사업자 정보">
            <h2 className="font-serif text-lg font-bold text-gold">사업자 정보</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {info.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-text-sub">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <nav aria-label="다른 안내" className="mt-8 flex flex-wrap gap-2">
          {LEGAL_DOCS.filter((d) => d.slug !== doc.slug).map((d) => (
            <Link key={d.slug} href={`/legal/${d.slug}`} className="press flex items-center rounded-pill border border-gold/40 px-4 text-sm text-gold">
              {d.title}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
