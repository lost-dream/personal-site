import { useRef, useState } from "react";
import { portfolioContent, type Photo } from "./content";
import { Works } from "./Works";
import { MediaViewer } from "./MediaViewer";
import { useV2Motion } from "./motion";
import { WorksPhotoBackground } from "./WorksPhotoBackground";
import "./portfolio.css";
import "./responsive.css";
import "./works-preview.css";

/** A separate entry, sharing the real module rather than copying its markup. */
export function WorksPreview() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Photo | null>(null);
  useV2Motion(root);
  return <div className="portfolio-v2 v2-works-preview" ref={root}>
    <a className="skip-link" href="#preview-main">跳到作品集内容</a>
    <header className="v2-preview-bar v2-container">
      <span>第三模块 · 独立预览</span>
      <div className="v2-preview-actions">
        <a href="./projects-before-background.html">修改前对比 ↗</a>
        <a href={`${import.meta.env.BASE_URL}#projects`}>返回完整网站 ↗</a>
      </div>
    </header>
    <main id="preview-main">
      <Works content={portfolioContent} onView={setSelected} background={<WorksPhotoBackground />} />
    </main>
    {selected && <MediaViewer key={selected.id} photo={selected} onClose={() => setSelected(null)} />}
  </div>;
}
