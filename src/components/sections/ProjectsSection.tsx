import type { ProjectItem } from '@/content/types';
import { ResponsiveMedia } from '../media/ResponsiveMedia';

type Props = {
  projects: ProjectItem[];
};

export function ProjectsSection({ projects }: Props) {
  return (
    <section id="projects" className="projects-section section-shell" data-gsap-project-stage>
      <h2 data-reveal-title>精选项目</h2>
      {projects.length === 0 && (
        <div className="project-empty" data-reveal-item>
          <h3>项目待补充</h3>
          <p>添加一段真实的项目经历，从这些资料开始：</p>
          <ul aria-label="项目资料清单">
            <li>项目名称与时间</li>
            <li>团队目标、个人角色与关键行动</li>
            <li>项目结果、复盘与项目图片</li>
          </ul>
        </div>
      )}
      <div className="project-stack">
        {projects.slice(0, 3).map((project, index) => (
          <article
            className={`project-card${index === 1 ? ' project-card-reverse' : ''}`}
            key={project.title}
            data-gsap-project-card
          >
            <div className="project-card-inner" data-reveal-item>
              <div className="project-media-wrap" data-gsap-parallax>
                <ResponsiveMedia asset={project.media} label={`${project.title}图片`} aspect={project.aspect} />
              </div>
              <div className="project-copy">
                <span className="project-period">{project.period}</span>
                <h3>{project.title}</h3>
                <dl>
                  <div>
                    <dt>团队目标</dt>
                    <dd>{project.teamGoal}</dd>
                  </div>
                  <div>
                    <dt>个人角色</dt>
                    <dd>{project.role}</dd>
                  </div>
                  <div>
                    <dt>关键行动</dt>
                    <dd>{project.action}</dd>
                  </div>
                  <div>
                    <dt>项目结果</dt>
                    <dd>{project.result}</dd>
                  </div>
                </dl>
                <p className="project-reflection">{project.reflection}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
