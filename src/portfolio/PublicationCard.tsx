import { useState } from "react";
import { ArrowUpRight, BookOpen } from "@phosphor-icons/react";
import { externalHref, type Publication } from "./content";
import { PublicationReader } from "./PublicationReader";
import "./publications.css";

/** An authored publication, deliberately distinct from third-party news coverage. */
export function PublicationCard({ publication }: { publication: Publication }) {
  const [reading, setReading] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const cover = publication.pages[0];
  const href = externalHref(publication.href);
  return <>
    <article id={`publication-${publication.id}`} className="v2-publication-card" data-v2-item>
      <button className="v2-publication-cover" type="button" aria-label={`查看论文《${publication.title}》`} onClick={() => setReading(true)}>
        {cover && !coverFailed ? <img src={cover.thumbnail || cover.src} alt={`${publication.title}的论文首页，署名${publication.author}`} width={cover.width} height={cover.height} loading="lazy" decoding="async" onError={() => setCoverFailed(true)} />
          : <span>论文首页预览暂不可用 · 点击阅读</span>}
      </button>
      <div className="v2-publication-copy">
        <span className="v2-publication-kicker"><BookOpen size={18} aria-hidden="true" />期刊论文 · 技术综述</span>
        <h4>{publication.title}</h4>
        <p className="v2-publication-author">作者：{publication.author}</p>
        <p className="v2-publication-meta">《{publication.journal}》 · {publication.year} 年 · 第 {publication.volume} 卷第 {publication.issue} 期 · {publication.firstPage}–{publication.firstPage + publication.pages.length - 1} 页</p>
        <p className="v2-publication-summary">{publication.summary}</p>
        <p className="v2-publication-doi">DOI：{publication.doi}</p>
        <div className="v2-publication-actions">
          <button type="button" className="v2-publication-read" onClick={() => setReading(true)}>站内阅读全文 <span>共 {publication.pages.length} 页</span></button>
          {href && <a href={href} target="_blank" rel="noopener noreferrer" aria-label="期刊官网原文（新窗口）">期刊官网原文 <ArrowUpRight size={17} aria-hidden="true" /></a>}
        </div>
      </div>
    </article>
    {reading && <PublicationReader publication={publication} onClose={() => setReading(false)} />}
  </>;
}
