import { render, screen } from '@testing-library/react';
import { profileContent } from '@/content/profile';
import { ProjectsSection } from './ProjectsSection';

it('explains the project fields to add when the list is empty', () => {
  render(<ProjectsSection projects={[]} />);
  expect(screen.getByRole('heading', { name: '项目待补充' })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: '项目资料清单' })).toHaveTextContent('项目名称与时间');
  expect(screen.getByRole('list', { name: '项目资料清单' })).toHaveTextContent('团队目标、个人角色与关键行动');
  expect(screen.getByRole('list', { name: '项目资料清单' })).toHaveTextContent('项目结果、复盘与项目图片');
});

it('renders configured project media with its descriptive alt text', () => {
  const projects = structuredClone(profileContent.projects);
  projects[0].media = { src: '/project.jpg', alt: '项目界面概览' };
  render(<ProjectsSection projects={projects} />);
  expect(screen.getByRole('img', { name: '项目界面概览' })).toHaveAttribute('src', '/project.jpg');
});

it('renders three structured projects without fabricated results', () => {
  render(<ProjectsSection projects={profileContent.projects} />);

  expect(screen.getByRole('heading', { level: 2, name: '精选项目' })).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(screen.getAllByText('结果待补充')).toHaveLength(3);
  expect(screen.getAllByRole('img', { name: /蓝色图片占位/ })).toHaveLength(3);
});

it('keeps reveal transforms nested inside GSAP-owned wrappers', () => {
  const { container } = render(<ProjectsSection projects={profileContent.projects} />);

  for (const card of container.querySelectorAll('[data-gsap-project-card]')) {
    expect(card).not.toHaveAttribute('data-reveal-item');
    expect(card.querySelector(':scope > [data-reveal-item]')).toBeInTheDocument();
  }

  for (const parallax of container.querySelectorAll('[data-gsap-parallax]')) {
    expect(parallax).not.toHaveAttribute('data-reveal-item');
  }
});

it('marks the middle project for an asymmetric layout independent of pin spacers', () => {
  render(<ProjectsSection projects={profileContent.projects} />);

  expect(screen.getAllByRole('article')[1]).toHaveClass('project-card-reverse');
});
