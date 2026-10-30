import type { StrengthItem } from '@/content/types';

export function StrengthsSection({ strengths }: { strengths: StrengthItem[] }) {
  return (
    <section id="strengths" className="strengths-section section-shell">
      <h2 data-reveal-title>个人优势</h2>
      <div className="strength-grid">
        {strengths.map((item) => (
          <article className="strength-card" key={item.title} data-reveal-item>
            <div className="strength-card-inner">
              <h3>{item.title}</h3>
              <p>{item.evidence}</p>
              <span>{item.relatedExperience}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
