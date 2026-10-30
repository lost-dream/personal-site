import { useState, type CSSProperties } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { DocumentWall } from "./DocumentWall";
import { PracticeBackdrop } from "./PracticeBackdrop";
import type { Photo } from "./content";
import { practiceGalleryGroups as groups, practiceGalleryMotion as motion } from "./practice-gallery.config";
import "./practice-gallery.css";

/** Shared main-site and preview composition of seven albums using the dissolve carousel. */
export function PracticeGallery({ onView, suspended = false }: {
  onView: (photo: Photo) => void;
  suspended?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const saveData = useReducedData();
  const count = groups.reduce((total, group) => total + group.photos.length, 0);

  return (
    <section id="practice" className="v2-section v2-practice-gallery" aria-labelledby="practice-title"
      style={{ "--gallery-photo-opacity": motion.opacity, "--gallery-feather": `${motion.featherPx}px` } as CSSProperties}>
      <PracticeBackdrop />
      <div className="v2-container">
        <div className="v2-gallery-heading">
          <div>
            <p className="v2-gallery-eyebrow">现场，也有日常</p>
            <h2 id="practice-title" className="v2-heading" data-v2-title>把热爱付诸实践</h2>
            <p className="v2-intro">比赛、实践与生活中的片刻，在这里慢慢轮换。</p>
          </div>
          {!reduced && !saveData && <button className="v2-gallery-pause" type="button"
            aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            {paused ? "继续照片轮换" : "暂停照片轮换"}
          </button>}
        </div>
        <div className="v2-gallery-meta">
          <span>7 个相册 · {count} 张照片</span>
          <span>悬停暂停 · 点击放大</span>
        </div>
        <div className="v2-gallery-grid" data-v2-group>
          {groups.map((group) => (
            <article key={group.id} className={`v2-gallery-tile gallery-${group.id}`} data-v2-item>
              <DocumentWall photos={group.wallPhotos} title={group.title}
                intervalMs={motion.dwellMs}
                suspended={suspended} autoPaused={paused}
                onView={(photo) => {
                  const original = group.photos.find((candidate) => candidate.id === photo.id);
                  if (original) onView(original);
                }} />
              <div className="v2-gallery-caption">
                <h3>{group.title}</h3>
                <span>{group.photos.length} 张</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
