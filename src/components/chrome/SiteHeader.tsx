import { List } from '@phosphor-icons/react';
import { useCallback, useRef, useState } from 'react';
import { useActiveSection } from '@/hooks/useActiveSection';
import { MobileMenu } from './MobileMenu';

const sectionIds = ['home', 'experience', 'projects', 'strengths', 'contact'];
const links = [
  ['experience', '经历'],
  ['projects', '项目'],
  ['strengths', '优势'],
  ['contact', '联系'],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const active = useActiveSection(sectionIds);

  const closeMenu = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => menuButtonRef.current?.focus());
  }, []);

  return (
    <header className="site-header" data-opening-nav>
      <a
        className="wordmark"
        href="#home"
        aria-current={active === 'home' ? 'location' : undefined}
      >
        个人档案
      </a>
      <nav className="desktop-nav" aria-label="主要导航">
        {links.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? 'location' : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <a className="header-contact" href="#contact">
        联系我
      </a>
      <button
        ref={menuButtonRef}
        className="menu-button"
        type="button"
        aria-controls="mobile-navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        aria-label="打开导航"
      >
        <List aria-hidden="true" />
      </button>
      <MobileMenu activeId={active} open={open} onClose={closeMenu} />
    </header>
  );
}
