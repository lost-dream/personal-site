import { getMotionPreference } from './motionPolicy';

it('maps the media query to a stable motion preference', () => {
  expect(getMotionPreference({ matches: true })).toBe('reduced');
  expect(getMotionPreference({ matches: false })).toBe('full');
});
