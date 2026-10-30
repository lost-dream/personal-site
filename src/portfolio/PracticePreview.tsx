import { useRef, useState } from "react";
import type { Photo } from "./content";
import { PracticeGallery } from "./PracticeGallery";
import { MediaViewer } from "./MediaViewer";
import { useV2Motion } from "./motion";
import "./portfolio.css";
import "./responsive.css";
import "./practice-preview.css";

/** Module four's isolated preview, sharing the same completed gallery as the main site. */
export function PracticePreview() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Photo | null>(null);
  useV2Motion(root);

  return (
    <div className="portfolio-v2 v2-practice-preview" ref={root}>
      <a className="skip-link" href="#practice-preview-main">跳到实践照片</a>
      <header className="v2-practice-preview-bar v2-container">
        <span>第四模块 · 独立预览</span>
        <a href={`${import.meta.env.BASE_URL}#practice`}>返回完整网站 ↗</a>
      </header>
      <main id="practice-preview-main">
        <PracticeGallery onView={setSelected} suspended={Boolean(selected)} />
      </main>
      {selected && (
        <MediaViewer key={selected.id} photo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
