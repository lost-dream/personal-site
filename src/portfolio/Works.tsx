import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { Fragment, type ReactNode } from "react";
import { Media } from "./Media";
import { FlightVideo } from "./FlightVideo";
import { PublicationCard } from "./PublicationCard";
import "./flight-videos.css";
import "./programs.css";
import "./news.css";
import {
  externalHref,
  type Photo,
  type PortfolioContent,
  type Work,
} from "./content";

export function WorkLink({
  work,
  children,
  className = "",
}: {
  work: Work;
  children: ReactNode;
  className?: string;
}) {
  const href = externalHref(work.href);
  return href ? (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${work.title}（新窗口）`}
    >
      {children}
    </a>
  ) : (
    <div className={`${className} is-pending`}>{children}</div>
  );
}

function VideoWorkCard({ work, index, suspended }: { work: Work; index: number; suspended?: boolean }) {
  return <article className={work.video?.src ? `v2-flight-card v2-flight-slot-${index + 1}` : undefined} data-v2-item>
    {work.video?.src ? <>
      <FlightVideo key={work.video.src} photo={work.video} suspended={suspended} />
      {work.note && <p className="v2-flight-note">{work.note}</p>}
      {externalHref(work.href) && <WorkLink work={work} className="v2-inline-link">前往抖音观看 <ArrowUpRight aria-hidden="true" /></WorkLink>}
    </> : <WorkLink work={work} className="v2-video-card">
      <Media photo={work.image || { id: work.id, title: `${work.title}封面` }} />
      <div className="v2-card-caption">
        <h4>{work.title}</h4>
        <ArrowUpRight aria-hidden="true" />
      </div>
      <p>{work.note}</p>
      <span className="v2-link-note">{externalHref(work.href) ? "前往抖音观看" : "视频链接待补充"}</span>
    </WorkLink>}
  </article>;
}

export function Works({
  content,
  onView,
  background,
  backgroundControl,
  suspended = false,
}: {
  content: PortfolioContent;
  onView: (photo: Photo) => void;
  background?: ReactNode;
  backgroundControl?: ReactNode;
  suspended?: boolean;
}) {
  const hasFlightVideos = content.videos.some((work) => work.video?.src);
  return (
    <section
      id="projects"
      className="v2-section v2-works"
      aria-labelledby="works-title"
    >
      {background}
      <div className="v2-container">
        <div className="v2-works-heading">
          <h2 id="works-title" className="v2-heading" data-v2-title>
            个人作品集
          </h2>
          {backgroundControl}
        </div>
        <p className="v2-intro">用影像表达，用代码实现。</p>
        <div className="v2-work-group" data-v2-group>
          <div className="v2-group-heading">
            <h3>影像作品</h3>
            <p>换个高度，看世界。</p>
          </div>
          <div className={`v2-video-grid${hasFlightVideos ? " v2-flight-grid" : ""}`}>
            {hasFlightVideos ? <>
              <VideoWorkCard work={content.videos[0]} index={0} suspended={suspended} />
              <div className="v2-flight-stack">
                {content.videos.slice(1).map((work, index) => <VideoWorkCard key={work.id} work={work} index={index + 1} suspended={suspended} />)}
              </div>
            </> : content.videos.map((work, index) => <VideoWorkCard key={work.id} work={work} index={index} suspended={suspended} />)}
          </div>
        </div>
        <div className="v2-work-group" data-v2-group>
          <div className="v2-group-heading">
            <h3>小程序</h3>
            <p>把想法，做成可以使用的东西。</p>
          </div>
          <div className="v2-programs">
          {content.programs.map((program) => (
            <article id={program.id} className={`v2-program${program.image?.height && program.image?.width && program.image.height > program.image.width ? " v2-program--portrait" : ""}`} key={program.id} data-v2-item aria-label={program.title}>
              {program.image?.src ? <button
                className="v2-program-preview"
                type="button"
                aria-label={`放大${program.title}界面截图`}
                onClick={() => program.image && onView(program.image)}
              >
                <Media contain photo={program.image} />
              </button> : <Media
                photo={
                  program.image || { id: program.id, title: "小程序界面截图" }
                }
              />}
              <div className="v2-program-copy">
                <h4>{program.title}</h4>
                <p>{program.note}</p>
                <button
                  className="v2-qr"
                  type="button"
                  onClick={() =>
                    onView(
                      program.qr || {
                        id: `${program.id}-qr`,
                        title: "小程序二维码",
                      },
                    )
                  }
                  aria-label={`放大${program.title}二维码`}
                >
                  <Media
                    contain
                    photo={
                      program.qr || {
                        id: `${program.id}-qr`,
                        title: "二维码待补充",
                      }
                    }
                  />
                </button>
                <span className="v2-link-note">
                  {program.qr?.src
                    ? "扫码体验 · 点击放大"
                    : "真实二维码接入后可扫码体验"}
                </span>
              </div>
            </article>
          ))}
          </div>
        </div>
        <div id="open-source-projects" className="v2-work-group" data-v2-group>
          <div className="v2-group-heading">
            <h3>开源项目</h3>
            <p>从一个念头，到一次提交。</p>
          </div>
          <div className="v2-repos">
            {content.github.map((work) => (
              <article key={work.id} className="v2-repo" data-v2-item>
                <WorkLink work={work} className="v2-repo-link">
                  <Media
                    contain={Boolean(work.image?.src)}
                    photo={
                      work.image || { id: work.id, title: `${work.title}截图` }
                    }
                  />
                  <div className="v2-repo-copy">
                    <GithubLogo size={28} aria-hidden="true" />
                    <h4>{work.title}</h4>
                    <p>{work.note}</p>
                    <p>{work.contribution}</p>
                    {work.image?.src && <small className="v2-repo-image-credit">配图：GitHub 仓库信息图</small>}
                    <span className="v2-inline-link">
                      {externalHref(work.href) ? "查看仓库" : "仓库链接待补充"}{" "}
                      <ArrowUpRight aria-hidden="true" />
                    </span>
                  </div>
                </WorkLink>
              </article>
            ))}
          </div>
        </div>
        <div id="news-coverage" className="v2-work-group" data-v2-group>
          <div className="v2-group-heading">
            <h3>新闻里的足迹</h3>
            <p>留下一些被记录的时刻。</p>
          </div>
          {content.publications?.map((publication) => <PublicationCard key={publication.id} publication={publication} />)}
          <div className="v2-news">
            {content.news.map((work) => (
              <article key={work.id} className={`v2-news-entry${work.photos?.length ? " has-photos" : ""}`} data-v2-item>
                {!!work.photos?.length && <div className="v2-news-gallery">
                  {work.photos.map((photo) => <figure key={photo.id}>
                    <button className="v2-news-photo" type="button" aria-label={`放大${photo.title}`} onClick={() => onView(photo)}>
                      <Media contain photo={photo} />
                    </button>
                    <figcaption>图片来源：{work.source}</figcaption>
                  </figure>)}
                </div>}
                <WorkLink work={work} className="v2-news-link">
                  <div>
                    {(work.source || work.publishedAt) && <span className="v2-link-note">
                      {work.source}{work.source && work.publishedAt ? " · " : ""}
                      {work.publishedAt && <time dateTime={work.publishedAt}>{work.publishedAt.replaceAll("-", ".")}</time>}
                    </span>}
                    <h4>{work.title}</h4>
                    {work.excerpt ? <figure className="v2-news-excerpt">
                      <figcaption>原文节选 · 姓名所在片段</figcaption>
                      <blockquote cite={externalHref(work.href)}>
                        …{work.excerpt.split("池树孝").map((part, index) => <Fragment key={index}>{index > 0 && <mark>池树孝</mark>}{part}</Fragment>)}…
                      </blockquote>
                    </figure> : <p>{work.note}</p>}
                    {work.imageUnavailable && <p className="v2-news-image-note">原站配图暂不可用，待补充原图。</p>}
                    <span className="v2-link-note">
                      {externalHref(work.href) ? "阅读原文" : "报道链接待补充"}
                    </span>
                  </div>
                  <ArrowUpRight size={28} aria-hidden="true" />
                </WorkLink>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
