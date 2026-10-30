import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { externalHref, type Photo, type Publication } from "./content";
import "./publications.css";

function PaperPage({ page, zoom }: { page: Photo; zoom: number }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  return <div className="v2-publication-paper" style={{ width: `${zoom * 100}%`, maxWidth: `${900 * zoom}px` }}>
    {failed ? <p className="v2-publication-page-error" role="alert">本页暂时无法加载。可以切换页面，或使用下方“下载原始PDF”阅读全文。</p>
      : <img src={page.src} alt={page.alt || page.title} width={page.width} height={page.height} decoding="async" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
    {loading && <p className="v2-publication-loading" role="status">正在加载本页…</p>}
  </div>;
}

/** Native modal semantics, single-page loading, explicit zoom and paper pagination. */
export function PublicationReader({ publication, onClose }: { publication: Publication; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const current = publication.pages[page];
  const href = externalHref(publication.href);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (viewportRef.current) { viewportRef.current.scrollTop = 0; viewportRef.current.scrollLeft = 0; }
  }, [page]);

  return createPortal(<dialog ref={dialogRef} className="v2-publication-dialog" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={(event) => {
      if ((event.target as HTMLElement).matches("input, select, textarea")) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); setPage((index) => Math.max(0, index - 1)); }
      if (event.key === "ArrowRight") { event.preventDefault(); setPage((index) => Math.min(publication.pages.length - 1, index + 1)); }
    }}>
    <div className="v2-publication-curtain" aria-hidden="true"><img src={current.src} alt="" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} /></div>
    <div className="v2-publication-reader-panel">
      <header className="v2-publication-reader-header">
        <div><span>期刊论文 · 站内阅读</span><h2 id={titleId}>{publication.title}</h2></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭论文阅读"><X size={23} aria-hidden="true" /></button>
      </header>
      <div className="v2-publication-reader-toolbar">
        <span>{publication.author} · 《{publication.journal}》 · {publication.year} 年第 {publication.issue} 期</span>
        <label>页面缩放 <select aria-label="论文页面缩放" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
          <option value={1}>100% · 适合宽度</option><option value={1.25}>125%</option><option value={1.5}>150%</option><option value={2}>200%</option>
        </select></label>
      </div>
      <div className="v2-publication-reader-viewport" ref={viewportRef} tabIndex={0} role="region" aria-label="论文正文，可滚动阅读">
        <PaperPage key={page} page={current} zoom={zoom} />
      </div>
      <footer className="v2-publication-reader-footer">
        <div className="v2-publication-pagination" aria-label="论文翻页">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="论文上一页"><CaretLeft size={20} aria-hidden="true" /></button>
          {publication.pages.map((photo, index) => <button key={photo.id} type="button" aria-label={`跳至论文第${index + 1}页`} aria-current={page === index ? "page" : undefined} onClick={() => setPage(index)}>{index + 1}</button>)}
          <button type="button" onClick={() => setPage(page + 1)} disabled={page === publication.pages.length - 1} aria-label="论文下一页"><CaretRight size={20} aria-hidden="true" /></button>
        </div>
        <span className="v2-publication-page-count" role="status" aria-live="polite">第 {page + 1} / {publication.pages.length} 页 · 刊物第 {publication.firstPage + page} 页</span>
        <div className="v2-publication-reader-links">
          <a href={publication.pdf} download={`${publication.title}.pdf`}>下载原始PDF</a>
          {href && <a href={href} target="_blank" rel="noopener noreferrer">期刊官网原文 ↗</a>}
        </div>
      </footer>
    </div>
  </dialog>, document.body);
}
