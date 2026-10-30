/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('reduced-motion section styles', () => {
  it.each(['.hero-curtain', '.media-wipe'])(
    'keeps %s from covering static content',
    (selector) => {
      const styleElement = document.createElement('style');
      styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
      document.head.append(styleElement);

      const reducedMotionRule = Array.from(styleElement.sheet!.cssRules).find(
        (rule): rule is CSSMediaRule =>
          rule instanceof CSSMediaRule && rule.conditionText === '(prefers-reduced-motion: reduce)',
      );
      const overlayRule = Array.from(reducedMotionRule!.cssRules).find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule &&
          rule.selectorText.split(',').map((part) => part.trim()).includes(selector),
      );
      const overlayStyle = overlayRule!.style;
      const remainsHidden =
        overlayStyle.display === 'none' ||
        overlayStyle.visibility === 'hidden' ||
        overlayStyle.opacity === '0' ||
        overlayStyle.transform.includes('scaleX(0)');

      styleElement.remove();
      expect(remainsHidden).toBe(true);
    },
  );

  it('keeps strength cards still under reduced motion', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const reducedMotionRules = Array.from(styleElement.sheet!.cssRules).filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText === '(prefers-reduced-motion: reduce)',
    );
    const nestedRules = reducedMotionRules.flatMap((rule) => Array.from(rule.cssRules));
    const cardRule = nestedRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.strength-card-inner',
    );
    const hoverRule = nestedRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule &&
        rule.selectorText === '.strength-card:hover .strength-card-inner',
    );

    const allRules = Array.from(styleElement.sheet!.cssRules);
    const hoverOwnerIndex = allRules.findIndex(
      (rule) =>
        rule instanceof CSSMediaRule &&
        Array.from(rule.cssRules).some(
          (nested) =>
            nested instanceof CSSStyleRule &&
            nested.selectorText === '.strength-card:hover .strength-card-inner' &&
            nested.style.transform !== 'none',
        ),
    );
    const reducedIndex = allRules.findIndex((rule) => rule === reducedMotionRules.at(-1));

    styleElement.remove();
    expect(cardRule?.style.transition).toBe('none');
    expect(hoverRule?.style.transform).toBe('none');
    expect(reducedIndex).toBeGreaterThan(hoverOwnerIndex);
  });

  it('removes smooth scrolling and visual delays under reduced motion', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const reducedMotionRules = Array.from(styleElement.sheet!.cssRules).filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText === '(prefers-reduced-motion: reduce)',
    );
    const nestedRules = reducedMotionRules.flatMap((rule) => Array.from(rule.cssRules));
    const htmlRule = nestedRules.find(
      (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === 'html',
    );
    const universalRule = nestedRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('*::before'),
    );

    styleElement.remove();
    expect(htmlRule?.style.scrollBehavior).toBe('auto');
    expect(universalRule?.style.animationDuration).toBe('0.01ms');
    expect(universalRule?.style.transitionDuration).toBe('0.01ms');
  });
});

describe('section reveal ready states', () => {
  it('primes reveal nodes only when motion is ready', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const noPreferenceRule = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule &&
        rule.conditionText === '(prefers-reduced-motion: no-preference)',
    );
    const nestedRules = Array.from(noPreferenceRule!.cssRules);
    const revealRule = nestedRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('[data-reveal-title]'),
    );
    const wipeRule = nestedRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('[data-media-wipe]'),
    );

    styleElement.remove();
    expect(revealRule?.selectorText).toContain('.motion-ready [data-reveal-item]');
    expect(revealRule?.style.opacity).toBe('0');
    expect(wipeRule?.selectorText).toBe(
      '.motion-ready main > section:not(#home) [data-media-wipe]',
    );
    expect(wipeRule?.style.transform).toBe('scaleX(1)');
  });
});

describe('experience section layout', () => {
  it('uses the readable text token for the candidate name', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const candidateRule = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.candidate-name',
    );

    styleElement.remove();
    expect(candidateRule?.style.color).toBe('var(--text)');
  });

  it('overrides the temporary section dimensions with the full section shell', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const main = document.createElement('main');
    const section = document.createElement('section');
    section.className = 'section-shell';
    main.append(section);
    document.body.append(main);

    expect(getComputedStyle(section).minHeight).toBe('100dvh');

    main.remove();
    styleElement.remove();
  });

  it('lets wide hobby placeholders shrink inside the mobile column', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const mobileRules = Array.from(styleElement.sheet!.cssRules).filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText === '(width < 768px)',
    );
    const placeholderRule = mobileRules
      .flatMap((rule) => Array.from(rule.cssRules))
      .find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule && rule.selectorText === '.hobby-item .media-placeholder',
      );

    styleElement.remove();
    expect(placeholderRule?.style.minHeight).toBe('0px');
  });
});

describe('closing section layout', () => {
  it('uses an asymmetric named grid for the four strengths', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const grid = document.createElement('div');
    grid.className = 'strength-grid';
    document.body.append(grid);

    expect(getComputedStyle(grid).gridTemplateAreas).toContain('"a a b"');
    expect(getComputedStyle(grid).gridTemplateAreas).toContain('"c d d"');

    grid.remove();
    styleElement.remove();
  });

  it('gives the contact close at least one dynamic viewport of height', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const main = document.createElement('main');
    const contact = document.createElement('section');
    contact.className = 'contact-section';
    main.append(contact);
    document.body.append(main);

    expect(getComputedStyle(contact).minHeight).toBe('100dvh');

    main.remove();
    styleElement.remove();
  });

  it('lets the closing title override the generic section heading scale', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);

    const main = document.createElement('main');
    const contact = document.createElement('section');
    const inner = document.createElement('div');
    const title = document.createElement('h2');
    contact.className = 'contact-section';
    inner.className = 'contact-inner';
    inner.append(title);
    contact.append(inner);
    main.append(contact);
    document.body.append(main);

    expect(Number.parseFloat(getComputedStyle(title).fontSize)).toBeGreaterThan(100);

    main.remove();
    styleElement.remove();
  });
});

describe('final responsive and interaction fallbacks', () => {
  it('reserves distinct wide-project and video aspect ratios', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);
    const frame = document.createElement('div');
    frame.className = 'media-placeholder-wide';
    document.body.append(frame);
    expect(getComputedStyle(frame).aspectRatio).toBe('16 / 10');
    frame.className = 'media-placeholder-video';
    expect(getComputedStyle(frame).aspectRatio).toBe('16 / 9');
    frame.remove();
    styleElement.remove();
  });
  it('lets pointer events pass through hero copy while keeping actions interactive', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');
    document.head.append(styleElement);
    const content = document.createElement('div');
    content.className = 'hero-content';
    content.innerHTML = '<div class="hero-actions"><a href="#projects">Projects</a></div>';
    document.body.append(content);
    expect(getComputedStyle(content).pointerEvents).toBe('none');
    expect(getComputedStyle(content.querySelector('a')!).pointerEvents).toBe('auto');
    content.remove();
    styleElement.remove();
  });

  const getStyleSheet = (file = 'sections.css') => {
    const styleElement = document.createElement('style');
    styleElement.textContent = readFileSync(join(process.cwd(), `src/styles/${file}`), 'utf8');
    document.head.append(styleElement);
    return styleElement;
  };

  const mediaRules = (styleElement: HTMLStyleElement, condition: string) =>
    Array.from(styleElement.sheet!.cssRules).filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText === condition,
    );

  const effectiveDeclaration = (
    styleElement: HTMLStyleElement,
    selector: string,
    property: string,
    width: number,
  ) => {
    let value = '';
    const visit = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          const selectors = rule.selectorText.split(',').map((part) => part.trim());
          if (selectors.includes(selector) && rule.style.getPropertyValue(property)) {
            value = rule.style.getPropertyValue(property);
          }
          continue;
        }

        if (!(rule instanceof CSSMediaRule)) continue;
        const max = /max-width:\s*(\d+)px/.exec(rule.conditionText)?.[1];
        const min = /min-width:\s*(\d+)px/.exec(rule.conditionText)?.[1];
        const below = /width\s*<\s*(\d+)px/.exec(rule.conditionText)?.[1];
        if ((!max || width <= Number(max)) && (!min || width >= Number(min)) && (!below || width < Number(below))) {
          visit(rule.cssRules);
        }
      }
    };

    visit(styleElement.sheet!.cssRules);
    return value;
  };

  it.each([767.01, 767.5, 767.99999])('keeps fractional width %s in the mobile layout until 768px', (width) => {
    const styleElement = getStyleSheet();
    expect(effectiveDeclaration(styleElement, '.menu-button', 'display', width)).toBe('grid');
    expect(effectiveDeclaration(styleElement, '.desktop-nav', 'display', width)).toBe('none');
    expect(effectiveDeclaration(styleElement, '.project-card-inner', 'grid-template-columns', width)).toBe('1fr');
    styleElement.remove();
  });

  it('keeps fractional widths below 1024px in the tablet layout', () => {
    const styleElement = getStyleSheet();
    expect(effectiveDeclaration(styleElement, '.project-card-inner', 'grid-template-columns', 1023.5)).toBe('minmax(0, 1.1fr) minmax(280px, .9fr)');
    styleElement.remove();
  });

  it.each(['(width < 1024px)', '(width < 768px)', '(max-width: 320px)'])(
    'defines an explicit %s fallback tier',
    (condition) => {
      const styleElement = getStyleSheet();
      expect(mediaRules(styleElement, condition)).not.toHaveLength(0);
      styleElement.remove();
    },
  );

  it.each([
    [1024, 'minmax(0, 1.35fr) minmax(320px, .65fr)'],
    [1023, 'minmax(0, 1.1fr) minmax(280px, .9fr)'],
    [768, 'minmax(0, 1.1fr) minmax(280px, .9fr)'],
    [767, '1fr'],
    [320, '1fr'],
    [319, '1fr'],
  ])('resolves the project grid cascade at %ipx', (width, expected) => {
    const styleElement = getStyleSheet();

    expect(
      effectiveDeclaration(
        styleElement,
        '.project-card-inner',
        'grid-template-columns',
        width,
      ),
    ).toBe(expected);
    styleElement.remove();
  });

  it.each([
    [1023, 'clamp(4rem, 11vw, 8rem)'],
    [767, 'clamp(3.5rem, 17vw, 6rem)'],
    [320, 'clamp(3rem, 16vw, 3.5rem)'],
    [319, 'clamp(3rem, 16vw, 3.5rem)'],
  ])('resolves the section-heading cascade at %ipx', (width, expected) => {
    const styleElement = getStyleSheet();

    expect(
      effectiveDeclaration(
        styleElement,
        'main > section.section-shell > h2',
        'font-size',
        width,
      ),
    ).toBe(expected);
    styleElement.remove();
  });

  it('sets the hero media label position in the 320px CSS tier', () => {
    const styleElement = getStyleSheet();
    const rules = mediaRules(styleElement, '(max-width: 320px)').flatMap((rule) =>
      Array.from(rule.cssRules),
    );
    const label = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule &&
        rule.selectorText === '.hero-media > .media-placeholder .media-placeholder-label',
    );

    expect(label?.style.position).toBe('absolute');
    expect(label?.style.top).toBe('28%');
    styleElement.remove();
  });

  it('keeps the mobile menu reachable and the hero composed at the narrow breakpoint', () => {
    const styleElement = getStyleSheet();
    const rules = mediaRules(styleElement, '(width < 768px)').flatMap((rule) =>
      Array.from(rule.cssRules),
    );
    const menu = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.menu-button',
    );
    const hero = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.hero-content',
    );

    expect(menu?.style.minWidth).toBe('44px');
    expect(menu?.style.minHeight).toBe('44px');
    expect(hero?.style.alignContent).toBe('end');
    expect(hero?.style.paddingBottom).toBe('72px');
    styleElement.remove();
  });

  it('applies mobile body sizing after the imported section styles', () => {
    const styleElement = getStyleSheet('global.css');
    const rules = mediaRules(styleElement, '(width < 768px)').flatMap((rule) =>
      Array.from(rule.cssRules),
    );
    const body = rules.find(
      (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === 'body',
    );

    expect(body?.style.fontSize).toBe('16px');
    expect(body?.style.overflowX).toBe('clip');
    styleElement.remove();
  });

  it('lets tablet hobby media honor its grid track without intrinsic overflow', () => {
    const styleElement = getStyleSheet();
    const rules = mediaRules(styleElement, '(width < 1024px)').flatMap((rule) =>
      Array.from(rule.cssRules),
    );
    const placeholder = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.hobby-item .media-placeholder',
    );

    expect(placeholder?.style.minHeight).toBe('0px');
    styleElement.remove();
  });

  it('balances headings to avoid isolated final words', () => {
    const styleElement = getStyleSheet('global.css');
    const headingRule = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('h1') && rule.selectorText.includes('h3'),
    );

    expect(headingRule?.style.getPropertyValue('text-wrap')).toBe('balance');
    styleElement.remove();
  });

  it('lets long replacement headings break inside the viewport', () => {
    const styleElement = getStyleSheet('global.css');
    const headingRule = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('h1') && rule.selectorText.includes('h3'),
    );

    expect(headingRule?.style.overflowWrap).toBe('anywhere');
    styleElement.remove();
  });

  it('uses tabular figures for comparable experience statistics', () => {
    const styleElement = getStyleSheet();
    const statRule = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.experience-stats strong',
    );

    expect(statRule?.style.fontVariantNumeric).toBe('tabular-nums');
    styleElement.remove();
  });

  it('keeps the full-screen menu clear of device safe areas', () => {
    const styleElement = getStyleSheet();
    const menu = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.mobile-menu',
    );

    expect(menu?.style.paddingTop).toContain('safe-area-inset-top');
    expect(menu?.style.paddingBottom).toContain('safe-area-inset-bottom');
    styleElement.remove();
  });

  it('provides active feedback for primary navigation links', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/sections.css'), 'utf8');

    expect(css).toContain('.wordmark:active');
    expect(css).toContain('.desktop-nav a:active');
    expect(css).toContain('.mobile-menu nav a:active');
  });

  it('keeps interactive text high-contrast while signal blue supplies the cue', () => {
    const styleElement = getStyleSheet();
    const hoverRules = mediaRules(styleElement, '(hover: hover)').flatMap((rule) =>
      Array.from(rule.cssRules),
    );
    const hover = hoverRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('.desktop-nav a:hover'),
    );
    const active = Array.from(styleElement.sheet!.cssRules).find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('.desktop-nav a:active'),
    );

    expect(hover?.style.color).toBe('var(--text)');
    expect(hover?.style.textDecorationColor).toBe('var(--accent)');
    expect(active?.style.color).toBe('var(--text)');
    expect(active?.style.textDecorationColor).toBe('var(--accent)');
    styleElement.remove();
  });

  it('makes the already-blue primary action visibly respond to hover', () => {
    const styleElement = getStyleSheet();
    const hoverRules = mediaRules(styleElement, '(hover: hover)').flatMap((rule) =>
      Array.from(rule.cssRules),
    );
    const primary = hoverRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.hero-actions a:first-child:hover',
    );

    expect(primary).toBeDefined();
    expect(primary!.style.boxShadow).toContain('inset');
    styleElement.remove();
  });

  it('keeps hash destinations clear of the fixed header and contains menu overscroll', () => {
    const styleElement = getStyleSheet();
    const rules = Array.from(styleElement.sheet!.cssRules);
    const section = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === 'main section[id]',
    );
    const menu = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === '.mobile-menu',
    );

    expect(section?.style.scrollMarginTop).toBe('80px');
    expect(menu?.style.overscrollBehavior).toBe('contain');
    expect(menu?.style.height).toBe('100dvh');
    styleElement.remove();
  });
});
