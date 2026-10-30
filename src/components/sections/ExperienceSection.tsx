import type { ProfileContent } from '@/content/types';
import { ContactLink } from '../actions/ContactLink';
import { ResumeLink } from '../actions/ResumeLink';
import { ResponsiveMedia } from '../media/ResponsiveMedia';

export function ExperienceSection({ content }: { content: ProfileContent }) {
  const { identity } = content;

  return (
    <section id="experience" className="experience-section section-shell">
      <h2 data-reveal-title>个人经历</h2>

      <div className="experience-layout">
        <ResponsiveMedia asset={identity.portrait} label="人物照片" aspect="portrait" className="experience-portrait" />

        <article className="experience-intro" data-reveal-item>
          <p className="candidate-name">{identity.name}</p>
          <h3>{identity.role}</h3>
          <p className="candidate-summary">{identity.summary}</p>

          <dl className="candidate-details">
            <div>
              <dt>学校</dt>
              <dd>{identity.school}</dd>
            </div>
            <div>
              <dt>专业</dt>
              <dd>{identity.major}</dd>
            </div>
            <div>
              <dt>年级</dt>
              <dd>{identity.grade}</dd>
            </div>
            <div>
              <dt>方向</dt>
              <dd>{identity.target}</dd>
            </div>
          </dl>

          <div className="experience-contact">
            <h3>联系方式</h3>
            <dl>
              {content.contacts.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>
                    <ContactLink item={item} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <ResumeLink resume={content.resume} />
        </article>

        <div className="experience-stats" role="group" aria-label="经历数据" data-reveal-item>
          {content.stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <ol className="experience-timeline" aria-label="学习、团队与成长经历">
          {content.experiences.map((item) => (
            <li key={`${item.period}-${item.title}`} data-reveal-item>
              <span>{item.period}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="hobby-collage" role="group" aria-label="生活与兴趣">
          {content.hobbies.slice(0, 3).map((hobby) => (
            <article className="hobby-item" key={hobby.title} data-reveal-item>
              <ResponsiveMedia asset={hobby.media} label={`${hobby.title}影像`} aspect={hobby.aspect} />
              <h3>{hobby.title}</h3>
              <p>{hobby.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
