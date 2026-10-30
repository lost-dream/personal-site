import type { ProfileContent } from '@/content/types';
import { BackgroundVideo } from '../media/BackgroundVideo';

export function HeroSection({ content }: { content: ProfileContent }) {
  return (
    <section id="home" className="hero-section">
      <BackgroundVideo asset={content.heroVideo} />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-curtain" data-opening-curtain aria-hidden="true" />
      <div className="hero-content">
        <h1 aria-label="向前，正在发生。">
          <span className="title-mask">
            <span data-opening-title>向前，</span>
          </span>
          <span className="title-mask">
            <span data-opening-title>正在发生。</span>
          </span>
        </h1>
        <p data-opening-copy>{content.identity.summary}</p>
        <div className="hero-actions" data-opening-copy>
          <a href="#experience">查看经历</a>
          <a href="#contact">联系我</a>
        </div>
      </div>
    </section>
  );
}
