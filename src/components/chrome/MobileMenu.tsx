import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

const links = [
  ["experience", "经历"],
  ["projects", "项目"],
  ["strengths", "优势"],
  ["contact", "联系"],
] as const;

type Props = {
  activeId: string;
  open: boolean;
  onClose: () => void;
  items?: ReadonlyArray<readonly [string, string]>;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function isolateOutside(dialog: HTMLElement) {
  const isolated: Array<{
    element: HTMLElement;
    ariaHidden: string | null;
    hadInert: boolean;
  }> = [];
  let current = dialog;

  while (
    current.parentElement &&
    current.parentElement !== document.documentElement
  ) {
    const parent = current.parentElement;

    for (const sibling of parent.children) {
      if (sibling === current || !(sibling instanceof HTMLElement)) continue;

      isolated.push({
        element: sibling,
        ariaHidden: sibling.getAttribute("aria-hidden"),
        hadInert: sibling.hasAttribute("inert"),
      });
      sibling.setAttribute("aria-hidden", "true");
      sibling.setAttribute("inert", "");
    }

    current = parent;
  }

  return () => {
    for (const { element, ariaHidden, hadInert } of isolated) {
      if (ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", ariaHidden);

      if (!hadInert) element.removeAttribute("inert");
    }
  };
}

export function MobileMenu({ activeId, open, onClose, items = links }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const restoreIsolation = isolateOutside(dialog);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));

    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === first || !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreIsolation();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      id="mobile-navigation"
      className="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="移动导航"
    >
      <button type="button" onClick={onClose} aria-label="关闭导航">
        <X aria-hidden="true" />
      </button>
      <nav aria-label="移动导航链接">
        {items.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activeId === id ? "location" : undefined}
            onClick={onClose}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
