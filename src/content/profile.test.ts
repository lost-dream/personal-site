import { profileContent } from './profile';

describe('profileContent', () => {
  it('keeps private and result-bearing fields unconfigured', () => {
    expect(profileContent.identity.name).toBe('姓名待补充');
    expect(profileContent.resume).toBeUndefined();
    expect(profileContent.heroVideo).toBeUndefined();
    expect(profileContent.contacts.every((item) => item.href === undefined)).toBe(true);
    expect(profileContent.projects.every((item) => item.result === '结果待补充')).toBe(true);
    expect(profileContent.hobbies).toHaveLength(3);
    expect(profileContent.hobbies.every((item) => item.media === undefined)).toBe(true);
  });
});
