export type MotionPreference = 'full' | 'reduced';

export function getMotionPreference(media: Pick<MediaQueryList, 'matches'>): MotionPreference {
  return media.matches ? 'reduced' : 'full';
}
