import { fireEvent, render, screen } from '@testing-library/react';
import { profileContent } from '@/content/profile';
import { ExperienceSection } from './ExperienceSection';

describe('ExperienceSection', () => {
  it('renders configured portrait and hobby images and recovers from broken media', () => {
    const content = structuredClone(profileContent);
    content.identity.portrait = { src: '/portrait.jpg', alt: '人物在工作室' };
    content.hobbies[0].media = { src: '/hobby.jpg', alt: '山间徒步' };
    render(<ExperienceSection content={content} />);
    const portrait = screen.getByRole('img', { name: '人物在工作室' });
    expect(portrait).toHaveAttribute('src', '/portrait.jpg');
    expect(portrait).toHaveAttribute('loading', 'lazy');
    expect(portrait).toHaveAttribute('decoding', 'async');
    expect(portrait.closest('.media-placeholder')?.querySelector('[data-media-wipe]')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '山间徒步' })).toHaveAttribute('src', '/hobby.jpg');
    fireEvent.error(portrait);
    expect(screen.queryByRole('img', { name: '人物在工作室' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /人物照片.*蓝色图片占位/ })).toBeInTheDocument();
  });

  it('shows identity, education, stats, timeline, and safe resume state', () => {
    const { container } = render(<ExperienceSection content={profileContent} />);

    expect(screen.getByRole('heading', { level: 2, name: '个人经历' })).toBeInTheDocument();
    expect(screen.getByText('学校信息待补充')).toBeInTheDocument();
    expect(screen.getAllByText('待填写')).toHaveLength(3);
    expect(screen.getByText('简历待补充')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /简历/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /兴趣.*蓝色图片占位/ })).toHaveLength(3);
    expect(screen.getByRole('list', { name: '学习、团队与成长经历' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '经历数据' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '生活与兴趣' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-reveal-title]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-reveal-item]')).toHaveLength(8);
  });

  it('keeps incomplete contact details visible without unsafe links', () => {
    render(<ExperienceSection content={profileContent} />);

    expect(screen.getByRole('heading', { level: 3, name: '联系方式' })).toBeInTheDocument();
    expect(screen.getAllByText('资料待补充')).toHaveLength(3);
    expect(screen.queryByRole('link', { name: '资料待补充' })).not.toBeInTheDocument();
  });
});
