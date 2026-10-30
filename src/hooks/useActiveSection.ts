import { useEffect, useState } from 'react';

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? 'home');

  useEffect(() => {
    const visibility = new Map(ids.map((id) => [id, 0]));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        const visible = ids.reduce<{ id: string; ratio: number } | undefined>((best, id) => {
          const ratio = visibility.get(id) ?? 0;
          return ratio > 0 && (!best || ratio > best.ratio) ? { id, ratio } : best;
        }, undefined);

        if (visible) setActive(visible.id);
      },
      { rootMargin: '-35% 0px -55%', threshold: [0, 0.25, 0.5] },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [ids]);

  return active;
}
