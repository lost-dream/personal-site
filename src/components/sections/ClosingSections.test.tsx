import { render, screen } from '@testing-library/react';
import { profileContent } from '@/content/profile';
import { ContactSection } from './ContactSection';
import { StrengthsSection } from './StrengthsSection';

it('closes contact with a semantic anonymous copyright footer', () => {
  const { container } = render(<ContactSection content={profileContent} />);
  expect(container.querySelector('#contact footer')).toHaveTextContent('©');
  expect(container.querySelector('#contact footer')).toHaveTextContent('个人展示网站模板');
});

it('renders four evidence-led strengths without scores', () => {
  const { container } = render(<StrengthsSection strengths={profileContent.strengths} />);

  expect(screen.getByRole('heading', { name: '个人优势' })).toBeInTheDocument();
  expect(container.querySelectorAll('.strength-card')).toHaveLength(4);
  expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
});

it('keeps unconfigured contact values as text', () => {
  render(<ContactSection content={profileContent} />);

  expect(screen.getByRole('heading', { name: '保持联系' })).toBeInTheDocument();
  expect(screen.getAllByText('资料待补充')).toHaveLength(3);
  expect(screen.queryByRole('link', { name: '资料待补充' })).not.toBeInTheDocument();
  expect(screen.getByText('简历待补充')).not.toHaveRole('link');
});
