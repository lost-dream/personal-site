import type { ContactItem } from '@/content/types';

export function ContactLink({ item }: { item: ContactItem }) {
  return item.href ? <a href={item.href}>{item.value}</a> : <span>{item.value}</span>;
}
