import type { MediaAsset } from '@/content/types';

export function ResumeLink({ resume }: { resume?: MediaAsset }) {
  if (!resume) return <span className="action-disabled">简历待补充</span>;
  return <a href={resume.src} download>下载简历</a>;
}
