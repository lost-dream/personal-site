import { useState } from "react";
import { ArrowUpRight, Copy, QrCode } from "@phosphor-icons/react";
import { externalHref, type Social, type Photo } from "./content";

export function SocialLinks({
  socials,
  onView,
}: {
  socials: Social[];
  onView: (photo: Photo) => void;
}) {
  const [message, setMessage] = useState("");
  async function copy(social: Social) {
    try {
      await navigator.clipboard.writeText(social.value!);
      setMessage(`${social.label}账号已复制。`);
    } catch {
      setMessage("复制未完成，请长按或选中账号手动复制。");
    }
  }
  return (
    <div className="v2-socials" id="socials">
      <div className="v2-social-grid">
        {socials.map((social) => (
          <div className="v2-social" key={social.label} data-platform={social.platform}>
            {social.platform && (
              <img className="v2-social-brand" src={`${import.meta.env.BASE_URL}media/social/${social.platform}.jpg`}
                alt="" aria-hidden="true" width={120} height={120} />
            )}
            <div className="v2-social-account">
              <span>{social.label}</span>
              <strong>{social.value || "账号待补充"}</strong>
            </div>
            <div className="v2-social-actions">
              {social.value && (
                <button
                  type="button"
                  onClick={() => void copy(social)}
                  aria-label={`复制${social.label}账号`}
                >
                  <Copy aria-hidden="true" />
                </button>
              )}
              {social.qr?.src && (
                <button
                  type="button"
                  onClick={() => onView(social.qr!)}
                  aria-label={`查看${social.label}二维码`}
                >
                  <QrCode aria-hidden="true" />
                </button>
              )}
              {externalHref(social.href) && (
                <a
                  href={externalHref(social.href)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`打开${social.label}主页（新窗口）`}
                >
                  <ArrowUpRight aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="v2-feedback" role="status">
        {message}
      </p>
    </div>
  );
}
