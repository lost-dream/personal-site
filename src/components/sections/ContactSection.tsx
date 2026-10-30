import type { ProfileContent } from '@/content/types';
import { ContactLink } from '../actions/ContactLink';
import { ResumeLink } from '../actions/ResumeLink';

export function ContactSection({ content }: { content: ProfileContent }) {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-inner">
        <h2 data-reveal-title>保持联系</h2>
        <address data-reveal-item>
          {content.contacts.map((item) => (
            <p key={item.label}>
              <span>{item.label}</span>
              <ContactLink item={item} />
            </p>
          ))}
        </address>
        <div className="contact-actions" data-reveal-item>
          <ResumeLink resume={content.resume} />
          <a href="#home">返回顶部</a>
        </div>
        <footer><small>© 个人展示网站模板</small></footer>
      </div>
    </section>
  );
}
