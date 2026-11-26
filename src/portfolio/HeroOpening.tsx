import { heroOpeningMedia } from "./hero-opening.config";

/** One film layer and one exact end-frame; the existing live tunnel stays mounted. */
export function HeroOpening({ remaining }: { remaining: number }) {
  return <div className="v2-glass-opening v2-light-opening">
    <div className="v2-glass-shutter shutter-left" aria-hidden="true" />
    <div className="v2-glass-shutter shutter-right" aria-hidden="true" />
    <div className="v2-opening-countdown" role="timer" aria-label="网站开启倒计时" aria-live="off">
      <p className="v2-opening-label">池树孝 · 个人档案</p>
      <span className="v2-opening-seconds">{String(remaining).padStart(2, "0")}<small>s</small></span>
      <p className="v2-opening-caption">稍候，影像即将开启</p>
    </div>
    <div className="v2-light-screen" aria-hidden="true">
      <video data-light-opening-video src={heroOpeningMedia.video} muted playsInline preload="auto"
        tabIndex={-1} disablePictureInPicture />
      <img className="v2-light-end-frame" src={heroOpeningMedia.endFrame} alt="" width={1258} height={720}
        decoding="async" fetchPriority="high" draggable={false} />
    </div>
    <button className="v2-light-skip" type="button" data-opening-skip>跳过开场 <span aria-hidden="true">↗</span></button>
  </div>;
}
