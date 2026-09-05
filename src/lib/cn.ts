import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names so that later classes win over earlier ones even
 * when they belong to the same utility group (`p-2` vs `p-4`). Without this a
 * caller's `className` cannot override a component's default padding, which is
 * the single most common reason a shared primitive gets abandoned in favour of
 * hand-rolled markup.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
