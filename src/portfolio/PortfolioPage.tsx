import { useCallback, useRef, useState } from "react";
import { ArrowUpRight, List } from "@phosphor-icons/react";
import { MobileMenu } from "@/components/chrome/MobileMenu";
import { useActiveSection } from "@/hooks/useActiveSection";
import { portfolioContent, type Photo } from "./content";
import { PhotoWall } from "./PhotoWall";
import { PhotoTunnel } from "./PhotoTunnel";
import { PulsatingFrame } from "./PulsatingFrame";
import { SocialLinks } from "./SocialLinks";
import { MediaViewer } from "./MediaViewer";
import { Works } from "./Works";
import { WorksPhotoBackground } from "./WorksPhotoBackground";
import { PracticeGallery } from "./PracticeGallery";
import { useV2Motion } from "./motion";
import "./portfolio.css";
import "./responsive.css";
import "./hero-enhancements.css";
import "./glass-opening.css";
import "./hero-title.css";

const ids = ["home", "experience", "projects", "practice"];
const navigation = [
  ["experience", "个人经历"],
  ["projects", "个人作品集"],
  ["practice", "热爱与实践"],
] as const;

export function PortfolioPage() {
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);
  const active = useActiveSection(ids);
  const closeMenu = useCallback(() => {
    setMenu(false);
    queueMicrotask(() => menuButton.current?.focus());
  }, []);
  useV2Motion(root);
  const content = portfolioContent;
  return (
    <div className="portfolio-v2 v2-main-site" ref={root} data-opening="pending">
      <div className="v2-glass-opening" aria-hidden="true">
        <div className="v2-glass-shutter shutter-left" />
        <div className="v2-glass-shutter shutter-right" />
      </div>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <header className="v2-header" data-opening-nav>
        <a
          className="v2-wordmark"
          href="#home"
          aria-current={active === "home" ? "location" : undefined}
        >
          个人档案<span>PORTFOLIO</span>
        </a>
        <nav className="v2-nav" aria-label="主要导航">
          {navigation.map(([id, label]) => (
            <a
              href={`#${id}`}
              key={id}
              aria-current={active === id ? "location" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <a className="v2-contact-link" href="#socials">
          联系我 <ArrowUpRight aria-hidden="true" />
        </a>
        <button
          className="v2-menu-button"
          type="button"
          ref={menuButton}
          onClick={() => setMenu(true)}
          aria-label="打开导航"
          aria-expanded={menu}
          aria-controls="mobile-navigation"
        >
          <List aria-hidden="true" />
        </button>
        <MobileMenu
          activeId={active}
          open={menu}
          onClose={closeMenu}
          items={navigation}
        />
      </header>
      <main id="main">
        <section id="home" className="v2-hero" aria-labelledby="hero-title">
          <div className="v2-hero-backdrop" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}media/hero-background.jpg`} alt="" />
          </div>
          <div className="v2-container v2-hero-layout">
            <div className="v2-hero-copy">
              <div className="v2-hero-lead">
              <p className="v2-hero-kicker" data-opening-copy>
                个人作品与生活档案
              </p>
              <h1 id="hero-title" className="v2-frosted-title">
                <span className="v2-title-mask">
                  <span data-opening-title>认真生活</span>
                </span>
                <span className="v2-title-mask">
                  <span data-opening-title>
                    尽兴探索
                  </span>
                </span>
              </h1>
              <p className="v2-hero-description" data-opening-copy>
                {content.introduction || "在这里，认识作品背后的我。"}
              </p>
              </div>
              <div className="v2-hero-contact-block">
              <div className="v2-identity" data-opening-copy>
                <span>{content.name || "你的姓名"}</span>
                <span>
                  {content.name ? "欢迎来到我的个人网站" : "个人介绍待补充"}
                </span>
              </div>
              <PulsatingFrame suspended={Boolean(selected) || menu}>
                <div className="v2-glass-card">
                  <SocialLinks socials={content.socials} onView={setSelected} />
                </div>
              </PulsatingFrame>
              </div>
            </div>
            <div className="v2-hero-gallery" data-v2-opening-gallery>
              <PhotoTunnel
                photos={content.hero}
                onView={setSelected}
                suspended={Boolean(selected) || menu}
              />
            </div>
          </div>
        </section>
        <section
          id="experience"
          className="v2-section v2-experience"
          aria-labelledby="experience-title"
        >
          <div className="v2-hero-backdrop" aria-hidden="true">
            <img
              src={`${import.meta.env.BASE_URL}media/experience-background.webp`}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="v2-container">
            <h2 id="experience-title" className="v2-heading" data-v2-title>
              个人经历
            </h2>
            <p className="v2-intro">走过的路，也有纸上的回响。</p>
            <div className="v2-honors" data-v2-group>
              <article className="v2-honor" data-v2-item>
                <h3>荣誉</h3>
                <PhotoWall
                  photos={content.awards}
                  title="荣誉"
                  onView={setSelected}
                  suspended={Boolean(selected) || menu}
                />
              </article>
              <article className="v2-honor" data-v2-item>
                <h3>证书</h3>
                <PhotoWall
                  photos={content.certificates}
                  title="证书"
                  onView={setSelected}
                  suspended={Boolean(selected) || menu}
                />
              </article>
            </div>
          </div>
        </section>
        <Works
          content={content}
          onView={setSelected}
          background={<WorksPhotoBackground />}
          suspended={Boolean(selected) || menu}
        />
        <PracticeGallery onView={setSelected} suspended={Boolean(selected) || menu} />
      </main>
      <footer className="v2-footer v2-container">
        <span>个人作品与生活档案</span>
        <a href="#home">回到首页 ↑</a>
      </footer>
      {selected && (
        <MediaViewer
          key={selected.id}
          photo={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
